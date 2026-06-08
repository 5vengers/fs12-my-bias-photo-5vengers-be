import bcrypt from 'bcrypt';
import authRepository from '../repositories/authRepository.js';
import {
  DuplicateEmailError,
  DuplicateNicknameError,
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

const issueTokens = async (userId) => {
  const payload = { userId };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_MS);
  await authRepository.deleteRefreshTokenByUserId(userId);
  await authRepository.saveRefreshToken(userId, refreshToken, expiresAt);

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
  const isValid = user && (await bcrypt.compare(password, user.password));

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

  const stored = await authRepository.findRefreshToken(refreshToken);
  if (!stored) throw new InvalidTokenError();

  if (stored.expiresAt < new Date()) {
    await authRepository.deleteRefreshToken(refreshToken);
    throw new ExpiredTokenError();
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (err) {
    await authRepository.deleteRefreshToken(refreshToken);
    if (err.name === 'TokenExpiredError') throw new ExpiredTokenError();
    throw new InvalidTokenError();
  }

  const newPayload = { userId: payload.userId };
  const newAccessToken = signAccessToken(newPayload);
  const newRefreshToken = signRefreshToken(newPayload);

  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_MS);
  await authRepository.deleteRefreshToken(refreshToken);
  await authRepository.saveRefreshToken(
    stored.userId,
    newRefreshToken,
    expiresAt,
  );

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
 * 2. 이메일로 LOCAL 유저 조회 → 있으면 계정 충돌 에러
 * 3. 닉네임 중복 시 suffix 자동 생성 후 신규 유저 생성
 */
const findOrCreateGoogleUser = async ({ email, nickname, providerId }) => {
  // 1. 이미 Google로 가입한 유저인지 확인 (재로그인)
  const existingGoogleUser =
    await authRepository.findUserByProviderId(providerId);
  if (existingGoogleUser) {
    return { user: existingGoogleUser, isNewUser: false };
  }

  // 2. 같은 이메일로 LOCAL 계정이 있는 경우 → 충돌
  const emailUser = await authRepository.findUserByEmail(email);
  if (emailUser) {
    throw new OAuthError(
      '해당 이메일로 이미 가입된 계정이 있습니다. 이메일로 로그인해주세요.',
    );
  }

  // 3. 닉네임 중복 처리 - Google displayName이 이미 사용 중이면 suffix 추가
  let finalNickname = nickname;
  const nicknameUser = await authRepository.findUserByNickname(nickname);
  if (nicknameUser) {
    // providerId 앞 6자리를 suffix로 사용해 유니크 닉네임 생성
    finalNickname = `${nickname.slice(0, 14)}_${providerId.slice(0, 6)}`;
  }

  // 4. 신규 Google 유저 생성 (password 없음)
  const newUser = await authRepository.createUser({
    email,
    nickname: finalNickname,
    provider: 'GOOGLE',
    providerId,
  });

  return { user: newUser, isNewUser: true };
};

/**
 * OAuth 로그인 성공 후 JWT 토큰 발급
 * 기존 login()과 동일한 토큰 발급
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
