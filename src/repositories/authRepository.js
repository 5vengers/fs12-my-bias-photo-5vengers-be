import prisma from '../config/prisma.js';

const findUserByEmail = (email) => prisma.user.findUnique({ where: { email } });

const findUserByNickname = (nickname) =>
  prisma.user.findUnique({ where: { nickname } });

// Google OAuth 유저 조회
const findUserByProviderId = (providerId) =>
  prisma.user.findUnique({
    where: { provider_providerId: { provider: 'GOOGLE', providerId } },
  });

const createUser = (data) =>
  prisma.user.create({
    data: {
      ...data,
      userPoint: {
        create: { point: 0 },
      },
    },
  });

const findRefreshToken = (token) =>
  prisma.refreshToken.findUnique({
    where: { token },
  });

const deleteRefreshToken = (token) =>
  prisma.refreshToken.deleteMany({ where: { token } });

// 기존 토큰 삭제 + 새 토큰 저장을 단일 트랜잭션으로 처리
// delete -> save 사이에 서버 장애 발생 시 사용자가 강제 로그아웃되는 문제 방지
const replaceRefreshToken = (userId, token, expiresAt) =>
  prisma.$transaction([
    prisma.refreshToken.deleteMany({ where: { userId } }),
    prisma.refreshToken.create({ data: { userId, token, expiresAt } }),
  ]);

export default {
  findUserByEmail,
  findUserByNickname,
  findUserByProviderId,
  createUser,
  findRefreshToken,
  deleteRefreshToken,
  replaceRefreshToken,
};
