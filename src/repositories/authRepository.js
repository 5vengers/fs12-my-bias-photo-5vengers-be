import prisma from '../config/prisma.js';

const findUserByEmail = (email) => prisma.user.findUnique({ where: { email } });

const findUserByNickname = (nickname) =>
  prisma.user.findUnique({ where: { nickname } });

// Google OAuth 유저 조회 
const findUserByProviderId = (providerId) =>
  prisma.user.findFirst({ where: { providerId } });

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

const deleteRefreshTokenByUserId = (userId) =>
  prisma.refreshToken.deleteMany({ where: { userId } });

export default {
  findUserByEmail,
  findUserByNickname,
  findUserByProviderId,
  createUser,
  saveRefreshToken,
  findRefreshToken,
  deleteRefreshToken,
  deleteRefreshTokenByUserId,
};
