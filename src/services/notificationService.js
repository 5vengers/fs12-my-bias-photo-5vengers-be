import prisma from '../config/prisma.js';
import { notificationRepository } from '../repositories/notificationRepository.js';
import { sseManager } from '../libs/sseManager.js';
import {
  formatTimeAgo,
  getSubjectParticle,
  getObjectParticle,
} from '../utils/timeAgo.js';

// ─────────────────────────────────────────────
// 내부 헬퍼
// ─────────────────────────────────────────────

/**
 * 알림을 DB에 저장하고 SSE로 실시간 전송합니다.
 *
 * @param {{
 *   userId: string,
 *   type: import('@prisma/client').NotificationType,
 *   routeType: import('@prisma/client').RouteType,
 *   targetId?: number,
 *   message: string,
 *   preventDuplicate?: boolean  // true 시 동일 (type, targetId) 알림이 있으면 스킵
 * }} param0
 */
const createAndSend = async ({
  userId,
  type,
  routeType,
  targetId,
  message,
  preventDuplicate = false,
}) => {
  // 같은 알림 있으면 생성 안함
  if (preventDuplicate && targetId != null) {
    const existing = await notificationRepository.findByTypeAndTarget(
      type,
      targetId,
    );
    if (existing) return existing;
  }

  const notification = await notificationRepository.create({
    userId,
    type,
    routeType,
    targetId,
    message,
  });

  const unreadCount = await notificationRepository.countUnread(userId);

  sseManager.send(userId, 'notification', {
    id: notification.id,
    type: notification.type,
    routeType: notification.routeType,
    targetId: notification.targetId,
    message: notification.message,
    isRead: notification.isRead,
    createdAt: notification.createdAt,
    timeAgo: formatTimeAgo(notification.createdAt),
    unreadCount,
  });

  return notification;
};

// ─────────────────────────────────────────────
// 알림 트리거 (각 서비스에서 호출)
// ─────────────────────────────────────────────

/**
 * [TRADE_REQUEST] 교환 제안 알림 -> 판매자에게
 * exchangeService.create() 이후 호출
 */
const notifyTradeRequest = async (exchangeProposalId) => {
  const proposal = await prisma.exchangeProposal.findUnique({
    where: { id: exchangeProposalId },
    select: {
      id: true,
      proposer: { select: { nickname: true } },
      marketItem: {
        select: {
          sellerId: true,
          grade: true,
          myCard: { select: { photoCard: { select: { name: true } } } },
        },
      },
    },
  });
  if (!proposal) return;

  const { proposer, marketItem } = proposal;
  const cardLabel = `[${marketItem.grade} | ${marketItem.myCard.photoCard.name}]`;

  await createAndSend({
    userId: marketItem.sellerId,
    type: 'TRADE_REQUEST',
    routeType: 'EXCHANGE_PROPOSAL',
    targetId: proposal.id,
    message: `${proposer.nickname}님이 ${cardLabel}의 포토 카드 교환을 제안했습니다.`,
    preventDuplicate: true,
  });
};

/**
 * [TRADE_ACCEPTED] 교환 성사 알림 -> 제안자에게
 * [TRADE_REJECTED] 자동 거절 알림  -> 나머지 WAITING 제안자들에게
 * exchangeService.approve() 이후 호출
 */
const notifyTradeApproved = async (approvedProposalId) => {
  const approved = await prisma.exchangeProposal.findUnique({
    where: { id: approvedProposalId },
    select: {
      id: true,
      proposerId: true,
      marketItem: {
        select: {
          id: true,
          grade: true,
          seller: { select: { nickname: true } },
          myCard: { select: { photoCard: { select: { name: true } } } },
        },
      },
    },
  });
  if (!approved) return;

  const { proposerId, marketItem } = approved;
  const cardLabel = `[${marketItem.grade} | ${marketItem.myCard.photoCard.name}]`;

  // 1. 제안자에게 교환 성사 알림
  await createAndSend({
    userId: proposerId,
    type: 'TRADE_ACCEPTED',
    routeType: 'EXCHANGE_PROPOSAL',
    targetId: approved.id,
    message: `${marketItem.seller.nickname}님과의 ${cardLabel}의 포토카드 교환이 성사되었습니다.`,
    preventDuplicate: true,
  });

  // 2. approve로 자동 거절된 나머지 제안들 -> 각자 TRADE_REJECTED 알림
  //    notifyTradeRejected 내부에서 preventDuplicate: true로 중복 방지
  const autoRejected = await prisma.exchangeProposal.findMany({
    where: {
      marketItemId: marketItem.id,
      id: { not: approvedProposalId },
      status: 'REJECTED',
    },
    select: { id: true },
  });

  // 여러 개 비동기 작업 동시에 실행 + 실패해도 계속 진행
  await Promise.allSettled(autoRejected.map((p) => notifyTradeRejected(p.id)));
};

/**
 * [TRADE_REJECTED] 교환 거절 알림 -> 제안자에게
 * exchangeService.reject() 이후 호출, notifyTradeApproved 내부에서도 재사용
 */
const notifyTradeRejected = async (exchangeProposalId) => {
  const proposal = await prisma.exchangeProposal.findUnique({
    where: { id: exchangeProposalId },
    select: {
      id: true,
      proposerId: true,
      marketItem: {
        select: {
          grade: true,
          seller: { select: { nickname: true } },
          myCard: { select: { photoCard: { select: { name: true } } } },
        },
      },
    },
  });
  if (!proposal) return;

  const { proposerId, marketItem } = proposal;
  const cardLabel = `[${marketItem.grade} | ${marketItem.myCard.photoCard.name}]`;

  await createAndSend({
    userId: proposerId,
    type: 'TRADE_REJECTED',
    routeType: 'EXCHANGE_PROPOSAL',
    targetId: proposal.id,
    message: `${marketItem.seller.nickname}님과의 ${cardLabel}의 포토카드 교환이 거절되었습니다.`,
    preventDuplicate: true, // 직접 거절 후 자동 거절 경로로 중복 호출 방지
  });
};

/**
 * [CARD_PURCHASED] 구매 완료 알림 -> 구매자에게
 * [CARD_SOLD]      판매 성사 알림 -> 판매자에게
 * [CARD_SOLD_OUT]  품절 알림     -> 판매자에게 (isSoldOut 시에만)
 * orderService.purchase() 이후 호출
 *
 * @param {{ buyerId: string, marketItemId: number, quantity: number, isSoldOut: boolean }} param0
 */
const notifyPurchase = async ({
  buyerId,
  marketItemId,
  quantity,
  isSoldOut,
}) => {
  const [buyer, marketItem] = await Promise.all([
    prisma.user.findUnique({
      where: { id: buyerId },
      select: { nickname: true },
    }),
    prisma.marketItem.findUnique({
      where: { id: marketItemId },
      select: {
        sellerId: true,
        grade: true,
        myCard: { select: { photoCard: { select: { name: true } } } },
      },
    }),
  ]);

  if (!buyer || !marketItem) return;

  const cardName = marketItem.myCard.photoCard.name;
  const cardLabel = `[${marketItem.grade} | ${cardName}]`;
  const objectParticle = getObjectParticle(cardName);

  // 구매 완료 + 판매 성사 알림을 병렬 전송
  await Promise.allSettled([
    // 구매자: "[RARE | 우리집 앞마당] 1장을 성공적으로 구매했습니다."
    createAndSend({
      userId: buyerId,
      type: 'CARD_PURCHASED',
      routeType: 'MARKET_ITEM',
      targetId: marketItemId,
      message: `${cardLabel} ${quantity}장을 성공적으로 구매했습니다.`,
    }),
    // 판매자: "기머누님이 [RARE | 우리집 앞마당]을 1장 구매했습니다."
    createAndSend({
      userId: marketItem.sellerId,
      type: 'CARD_SOLD',
      routeType: 'MY_SELL_CARDS',
      targetId: marketItemId,
      message: `${buyer.nickname}님이 ${cardLabel}${objectParticle} ${quantity}장 구매했습니다.`,
    }),
  ]);

  // 품절 시 판매자에게 추가 알림
  // "[LEGENDARY | 우리집 앞마당]이 품절되었습니다."
  if (isSoldOut) {
    const subjectParticle = getSubjectParticle(cardName);
    await createAndSend({
      userId: marketItem.sellerId,
      type: 'CARD_SOLD_OUT',
      routeType: 'MY_SELL_CARDS',
      targetId: marketItemId,
      message: `${cardLabel}${subjectParticle} 품절되었습니다.`,
      preventDuplicate: true, // 동일 마켓 아이템 품절 알림 중복 방지
    });
  }
};

// ─────────────────────────────────────────────
// REST API용 비즈니스 로직
// ─────────────────────────────────────────────

/**
 * 알림 목록 + 페이지네이션 + timeAgo 계산
 */
// default 1 페이지 당 20개 알림
const getNotifications = async (userId, { page = 1, limit = 20 } = {}) => {
  const skip = (page - 1) * limit;

  const [notifications, total, unreadCount] = await Promise.all([
    notificationRepository.findByUserId(userId, { skip, take: limit }),
    notificationRepository.countByUserId(userId),
    notificationRepository.countUnread(userId),
  ]);

  return {
    notifications: notifications.map((n) => ({
      ...n,
      timeAgo: formatTimeAgo(n.createdAt),
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    unreadCount,
  };
};

const getUnreadCount = (userId) => notificationRepository.countUnread(userId);

const markAllAsRead = (userId) => notificationRepository.markAllAsRead(userId);

const markAsRead = (id, userId) =>
  notificationRepository.markAsRead(id, userId);

export const notificationService = {
  // 트리거
  notifyTradeRequest,
  notifyTradeApproved,
  notifyTradeRejected,
  notifyPurchase,
  // REST
  getNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
};
