import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import bcrypt from 'bcrypt';
import authRepository from '../repositories/authRepository.js';
import {
  DuplicateEmailError,
  DuplicateNicknameError,
  OAuthConflictError,
  OAuthError,
  UnauthorizedError,
  InvalidTokenError,
  ExpiredTokenError,
} from '../errors/appError.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../libs/jwt.js';
import { REFRESH_TOKEN_EXPIRES_MS } from '../constants/tokenConfig.js';

const SALT_ROUNDS = 10;

const MAX_NICKNAME_LENGTH = 20;
const UUID_SUFFIX_LENGTH = 8;
const NICKNAME_SEPARATOR_LENGTH = 1; // '_'

const NICKNAME_PREFIX_LENGTH =
  MAX_NICKNAME_LENGTH - UUID_SUFFIX_LENGTH - NICKNAME_SEPARATOR_LENGTH;

// 토큰 발급 + 저장 공통 함수 (login, oauthLogin, refresh에서 재사용)
// replaceRefreshToken으로 delete, save를 단일 트랜잭션으로 처리
const issueTokens = async (userId) => {
  const payload = { userId };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_MS);
  await authRepository.replaceRefreshToken(userId, refreshToken, expiresAt);

  return { accessToken, refreshToken };
};

const register = async ({ email, password, nickname }) => {
  const existingEmail = await authRepository.findUserByEmail(email);
  if (existingEmail) throw new DuplicateEmailError();

  const existingNickname = await authRepository.findUserByNickname(nickname);
  if (existingNickname) throw new DuplicateNicknameError();

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await authRepository.createUser({
    email,
    password: hashedPassword,
    nickname,
    provider: 'LOCAL',
  });

  return {
    id: user.id,
    email: user.email,
    nickname: user.nickname,
    provider: user.provider,
    created_at: user.createdAt,
  };
};

const login = async ({ email, password }) => {
  const user = await authRepository.findUserByEmail(email);

  // GOOGLE 유저는 password가 null이므로 provider 검사 먼저 수행
  const isValid =
    user &&
    user.provider === 'LOCAL' &&
    (await bcrypt.compare(password, user.password));

  if (!isValid)
    throw new UnauthorizedError('이메일 또는 비밀번호가 올바르지 않습니다.');

  const { accessToken, refreshToken } = await issueTokens(user.id);

  return {
    user: {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      provider: user.provider,
      created_at: user.createdAt,
    },
    accessToken,
    refreshToken,
  };
};

const logout = async (refreshToken) => {
  await authRepository.deleteRefreshToken(refreshToken);
};

const refresh = async (refreshToken) => {
  if (!refreshToken) {
    throw new UnauthorizedError('로그인이 필요합니다.');
  }

  // [1차 검증] DB에 토큰 존재 여부 확인
  // DB 검증 목적: 강제 로그아웃(서버 측 토큰 삭제)이나 토큰 rotation 후 재사용 탐지
  const stored = await authRepository.findRefreshToken(refreshToken);
  if (!stored) throw new InvalidTokenError();

  if (stored.expiresAt < new Date()) {
    await authRepository.deleteRefreshToken(refreshToken);
    throw new ExpiredTokenError();
  }

  // [2차 검증] JWT 서명 검증
  // JWT 검증 목적: DB에 저장됐더라도 서명이 위조된 토큰 차단
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (err) {
    await authRepository.deleteRefreshToken(refreshToken);
    if (err.name === 'TokenExpiredError') throw new ExpiredTokenError();
    throw new InvalidTokenError();
  }

  // JWT 페이로드의 userId와 DB의 userId 교차 검증
  if (payload.userId !== stored.userId) {
    await authRepository.deleteRefreshToken(refreshToken);
    throw new InvalidTokenError();
  }

  const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
    await issueTokens(stored.userId);

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

// ─────────────────────────────────────────────
// Google OAuth
// ─────────────────────────────────────────────

/**
 * Passport verify callback에서 호출
 * Google 프로필로 유저를 조회하거나 신규 생성한다.
 *
 * 처리 순서:
 * 1. providerId(Google UID)로 기존 Google 유저 조회 → 있으면 반환 (재로그인)
 * 2. 이메일로 LOCAL 유저 조회 → LOCAL 계정 충돌 시 OAuthConflictError(409)
 * 3. 닉네임 중복 시 randomUUID suffix로 유니크 닉네임 생성
 * 4. 신규 Google 유저 생성 (nickname P2002 race condition은 OAuthError로 변환)
 */
const findOrCreateGoogleUser = async ({ email, nickname, providerId }) => {
  // 1. 이미 Google로 가입한 유저인지 확인 (재로그인)
  const existingGoogleUser =
    await authRepository.findUserByProviderId(providerId);
  if (existingGoogleUser) {
    return { user: existingGoogleUser, isNewUser: false };
  }

  // 2. 같은 이메일로 LOCAL 계정이 있는 경우 -> 충돌 (409)
  // GOOGLE 계정은 허용
  const emailUser = await authRepository.findUserByEmail(email);
  if (emailUser && emailUser.provider === 'LOCAL') {
    throw new OAuthConflictError();
  }

  // 3. 닉네임 중복 처리
  // Google 프로필 닉네임을 최대 길이(20자)로 정규화
  const normalizedNickname = nickname.slice(0, MAX_NICKNAME_LENGTH);

  // 닉네임 충돌 시 UUID suffix를 붙여 유니크 닉네임 생성
  // nickname 최대 11자 + '_' + uuid 8자 = 최대 20자 (로컬 가입 최대치와 동일)
  let finalNickname = normalizedNickname;

  while (await authRepository.findUserByNickname(finalNickname)) {
    finalNickname = `${normalizedNickname.slice(
      0,
      NICKNAME_PREFIX_LENGTH,
    )}_${randomUUID().slice(0, UUID_SUFFIX_LENGTH)}`;
  }

  // 4. 신규 Google 유저 생성
  // while 루프 이후 nickname race condition이 발생하면 P2002가 터질 수 있음
  // -> DUPLICATE_NICKNAME(409)이 OAuth 흐름에서 반환되면 유저에게 혼란스러우므로 OAuthError로 래핑
  try {
    const newUser = await authRepository.createUser({
      email,
      nickname: finalNickname,
      provider: 'GOOGLE',
      providerId,
    });
    return { user: newUser, isNewUser: true };
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err?.code === 'P2002'
    ) {
      throw new OAuthError(
        '일시적인 오류가 발생했습니다. 다시 로그인해주세요.',
      );
    }
    throw err;
  }
};

/**
 * OAuth 로그인 성공 후 JWT 토큰 발급
 * issueTokens로 기존 login()과 동일한 흐름 재사용
 */
const oauthLogin = async (user) => {
  const { accessToken, refreshToken } = await issueTokens(user.id);
  return { accessToken, refreshToken };
};

export default {
  register,
  login,
  logout,
  refresh,
  findOrCreateGoogleUser,
  oauthLogin,
};
