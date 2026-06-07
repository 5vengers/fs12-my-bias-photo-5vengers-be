import bcrypt from 'bcrypt';
import authRepository from '../repositories/authRepository.js';
import {
  DuplicateEmailError,
  DuplicateNicknameError,
  UnauthorizedError,
  InvalidTokenError,
  ExpiredTokenError,
} from '../errors/appError.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../libs/jwt.js';

const SALT_ROUNDS = 10;
const REFRESH_TOKEN_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000;

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

  const payload = { userId: user.id };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_MS);
  await authRepository.deleteRefreshTokenByUserId(user.id);
  await authRepository.saveRefreshToken(user.id, refreshToken, expiresAt);

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
  // 토큰 없으면 바로 에러
  if (!refreshToken) throw new ExpiredTokenError();

  // DB에서 토큰 존재 여부 확인
  const stored = await authRepository.findRefreshToken(refreshToken);
  if (!stored) throw new InvalidTokenError();

  // 만료 여부 확인
  if (stored.expiresAt < new Date()) {
    await authRepository.deleteRefreshToken(refreshToken);
    throw new ExpiredTokenError();
  }

  // JWT 서명 검증
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    await authRepository.deleteRefreshToken(refreshToken);
    throw new InvalidTokenError();
  }

  // Rotation - 새 토큰 발급
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

export default { register, login, logout, refresh };
