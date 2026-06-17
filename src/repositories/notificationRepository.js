import prisma from '../config/prismaClient.js';

/**
 * 알림 생성
 */
const create = (data) => prisma.notification.create({ data });

/**
 * 유저별 알림 목록 조회 (최신순, 페이지네이션)
 */
const findByUserId = (userId, { skip = 0, take = 20 } = {}) =>
  prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    skip,
    take,
  });

/**
 * 유저별 총 알림 수
 */
const countByUserId = (userId) =>
  prisma.notification.count({ where: { userId } });

/**
 * 유저별 미읽은 알림 수
 */
const countUnread = (userId) =>
  prisma.notification.count({ where: { userId, isRead: false } });

/**
 * 동일 type + targetId 알림 조회 (중복 생성 방지용)
 * @param {string} type
 * @param {number} targetId
 */
const findByTypeAndTarget = (type, targetId) =>
  prisma.notification.findFirst({ where: { type, targetId } });

/**
 * 전체 읽음 처리
 */
const markAllAsRead = (userId) =>
  prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });

/**
 * 단일 알림 읽음 처리 
 */
const markAsRead = (id, userId) =>
  prisma.notification.updateMany({
    where: { id, userId },
    data: { isRead: true },
  });

export const notificationRepository = {
  create,
  findByUserId,
  countByUserId,
  countUnread,
  findByTypeAndTarget,
  markAllAsRead,
  markAsRead,
};
