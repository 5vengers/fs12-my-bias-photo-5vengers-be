import bcrypt from 'bcrypt';
import authRepositories from '../repositories/authRepositories.js';
import {
  DuplicateEmailError,
  DuplicateNicknameError,
  UnauthorizedError,
} from '../middlewares/errorHandler.js';
import { signAccessToken, signRefreshToken } from '../libs/jwt.js';

const SALT_ROUNDS = 10;

const register = async ({ email, password, nickname }) => {
  const existingEmail = await authRepositories.findUserByEmail(email);
  if (existingEmail) throw new DuplicateEmailError();

  const existingNickname = await authRepositories.findUserByNickname(nickname);
  if (existingNickname) throw new DuplicateNicknameError();

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await authRepositories.createUser({
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
  const user = await authRepositories.findUserByEmail(email);
  const isValid = user && (await bcrypt.compare(password, user.password));

  if (!isValid)
    throw new UnauthorizedError('이메일 또는 비밀번호가 올바르지 않습니다.');

  const payload = { id: user.id, email: user.email };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await authRepositories.saveRefreshToken(user.id, refreshToken, expiresAt);

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
  await authRepositories.deleteRefreshToken(refreshToken);
};

export default { register, login, logout };
