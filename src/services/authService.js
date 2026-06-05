import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import authRepositories from '../repositories/authRepositories.js';

const SALT_ROUNDS = 10;

const signAccessToken = (payload) =>
  jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });

const signRefreshToken = (payload) =>
  jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

const register = async ({ email, password, nickname }) => {
  const existingmail = await authRepositories.findUserByEmail(email);
  if (existingmail) {
    const error = new Error('이미 가입된 이메일입니다.');
    error.status = 409;
    throw error;
  }

  const existingNickname = await authRepositories.findUserByNickname(nickname);
  if (existingNickname) {
    const error = new Error('이미 사용 중인 닉네임입니다.');
    error.status = 409;
    throw error;
  }

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

  if (!isValid) {
    const error = new Error('이메일 또는 비밀번호가 올바르지 않습니다.');
    error.status = 401;
    throw error;
  }

  const payload = { id: user.id, email: user.email };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7일
  await authRepositories.saveRefreshToken(user.id, refreshToken, expiresAt); // refreshToken db에 저장

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
  await authRepositories.deleteRefreshToken(refreshToken); // db에서 refreshToken 삭제 
};

export default { register, login, logout };
