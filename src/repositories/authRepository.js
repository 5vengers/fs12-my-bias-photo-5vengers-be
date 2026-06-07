import prisma from '../config/prisma.js';

const findUserByEmail = (email) => prisma.user.findUnique({ where: { email } });

const findUserByNickname = (nickname) =>
  prisma.user.findUnique({ where: { nickname } });

const createUser = (data) => prisma.user.create({ data });

const saveRefreshToken = (userId, token, expiresAt) =>
  prisma.refreshToken.create({
    data: { userId, token, expiresAt },
  });

const findRefreshToken = (token) =>
  prisma.refreshToken.findUnique({
    where: { token },
    include: { user: true },
  });

const deleteRefreshToken = (token) =>
  prisma.refreshToken.deleteMany({ where: { token } });

// 로그인 시 기존 토큰 전체 삭제
const deleteRefreshTokenByUserId = (userId) =>
  prisma.refreshToken.deleteMany({ where: { userId } });

export default {
  findUserByEmail,
  findUserByNickname,
  createUser,
  saveRefreshToken,
  findRefreshToken,
  deleteRefreshToken,
  deleteRefreshTokenByUserId,
};
