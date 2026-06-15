import prisma from '../config/prisma.js';
import { AppError } from '../errors/appError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';

const findMarketItem = async (marketItemId) => {
  return prisma.marketItem.findUnique({
    where: { id: marketItemId },
    include: { myCard: true },
  });
};

const findMyCard = async (myCardId) => {
  return prisma.myCard.findUnique({
    where: { id: myCardId },
  });
};

const getActiveSellingQuantity = async (myCardId) => {
  const listings = await prisma.marketItem.findMany({
    where: {
      myCardId,
      status: 'SELLING',
    },
    select: {
      quantity: true,
      soldQuantity: true,
    },
  });

  return listings.reduce(
    (sum, item) => sum + (item.quantity - item.soldQuantity),
    0,
  );
};

const findWaitingExchange = async (marketItemId, proposerId) => {
  return prisma.exchangeProposal.findFirst({
    where: {
      marketItemId,
      proposerId,
      status: 'WAITING',
    },
  });
};

const create = async ({ marketItemId, proposerId, offeredCardId }) => {
  return prisma.exchangeProposal.create({
    data: {
      marketItemId,
      proposerId,
      offeredCardId,
    },
  });
};

const findSent = async (proposerId) => {
  return prisma.exchangeProposal.findMany({
    where: { proposerId },
    include: {
      marketItem: true,
      offeredCard: {
        include: { photoCard: true },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

const findReceived = async (sellerId) => {
  return prisma.exchangeProposal.findMany({
    where: {
      marketItem: { sellerId },
    },
    include: {
      marketItem: true,
      offeredCard: {
        include: { photoCard: true },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

const approve = async ({ exchangeId, sellerId }) => {
  return prisma.$transaction(async (tx) => {
    const exchange = await tx.exchangeProposal.findUnique({
      where: { id: exchangeId },
      include: {
        offeredCard: true,
        marketItem: {
          include: { myCard: true },
        },
      },
    });

    if (!exchange) {
      throw new AppError(
        '교환 신청을 찾을 수 없습니다.',
        404,
        ERROR_CODES.EXCHANGE_NOT_FOUND,
      );
    }

    if (exchange.marketItem.sellerId !== sellerId) {
      throw new AppError(
        '교환 신청을 처리할 권한이 없습니다.',
        403,
        ERROR_CODES.FORBIDDEN,
      );
    }

    if (exchange.status !== 'WAITING') {
      throw new AppError(
        '이미 처리된 교환 신청입니다.',
        409,
        ERROR_CODES.EXCHANGE_NOT_WAITING,
      );
    }

    const marketItem = exchange.marketItem;

    if (marketItem.status !== 'SELLING') {
      throw new AppError(
        '현재 거래 가능한 판매글이 아닙니다.',
        409,
        ERROR_CODES.MARKET_ITEM_NOT_SELLING,
      );
    }

    if (exchange.offeredCard.photoCardId === marketItem.myCard.photoCardId) {
      throw new AppError(
        '같은 종류의 카드는 교환할 수 없습니다.',
        409,
        ERROR_CODES.CANNOT_EXCHANGE_SAME_CARD,
      );
    }

    // 동일 교환 신청의 중복 승인 방지
    const claimed = await tx.exchangeProposal.updateMany({
      where: {
        id: exchangeId,
        status: 'WAITING',
      },
      data: {
        status: 'APPROVED',
      },
    });

    if (claimed.count === 0) {
      throw new AppError(
        '이미 처리된 교환 신청입니다.',
        409,
        ERROR_CODES.EXCHANGE_NOT_WAITING,
      );
    }

    // 구매와 교환 승인이 동시에 발생해도 하나만 재고 확보
    const updatedStock = await tx.marketItem.updateMany({
      where: {
        id: marketItem.id,
        status: 'SELLING',
        quantity: marketItem.quantity,
        soldQuantity: {
          lte: marketItem.quantity - 1,
        },
      },
      data: {
        soldQuantity: { increment: 1 },
      },
    });

    if (updatedStock.count === 0) {
      throw new AppError(
        '교환 가능한 판매 카드가 없습니다.',
        409,
        ERROR_CODES.INSUFFICIENT_STOCK,
      );
    }

    // 신청자가 제안한 카드의 판매 예약 수량 계산
    const reservedQuantity = await tx.marketItem.aggregate({
      where: {
        myCardId: exchange.offeredCardId,
        status: 'SELLING',
      },
      _sum: {
        quantity: true,
        soldQuantity: true,
      },
    });

    const reserved =
      (reservedQuantity._sum.quantity ?? 0) -
      (reservedQuantity._sum.soldQuantity ?? 0);

    // 신청자의 제안 카드 차감
    const decreasedOfferedCard = await tx.myCard.updateMany({
      where: {
        id: exchange.offeredCardId,
        ownerId: exchange.proposerId,
        quantity: {
          gte: reserved + 1,
        },
      },
      data: {
        quantity: { decrement: 1 },
      },
    });

    if (decreasedOfferedCard.count === 0) {
      throw new AppError(
        '판매 중인 수량을 제외하면 교환 가능한 카드가 없습니다.',
        409,
        ERROR_CODES.INSUFFICIENT_EXCHANGE_CARD,
      );
    }

    // 판매자의 판매 카드 차감
    const decreasedSellerCard = await tx.myCard.updateMany({
      where: {
        id: marketItem.myCardId,
        ownerId: sellerId,
        quantity: { gte: 1 },
      },
      data: {
        quantity: { decrement: 1 },
      },
    });

    if (decreasedSellerCard.count === 0) {
      throw new AppError(
        '판매자의 카드 수량이 부족합니다.',
        409,
        ERROR_CODES.INSUFFICIENT_STOCK,
      );
    }

    // 판매자에게 신청자의 제안 카드 지급
    await tx.myCard.upsert({
      where: {
        ownerId_photoCardId: {
          ownerId: sellerId,
          photoCardId: exchange.offeredCard.photoCardId,
        },
      },
      update: {
        quantity: { increment: 1 },
      },
      create: {
        ownerId: sellerId,
        photoCardId: exchange.offeredCard.photoCardId,
        quantity: 1,
      },
    });

    // 신청자에게 판매자의 카드 지급
    await tx.myCard.upsert({
      where: {
        ownerId_photoCardId: {
          ownerId: exchange.proposerId,
          photoCardId: marketItem.myCard.photoCardId,
        },
      },
      update: {
        quantity: { increment: 1 },
      },
      create: {
        ownerId: exchange.proposerId,
        photoCardId: marketItem.myCard.photoCardId,
        quantity: 1,
      },
    });

    const updatedMarketItem = await tx.marketItem.findUnique({
      where: {
        id: marketItem.id,
      },
    });

    // 판매 수량이 모두 소진된 경우 품절 처리
    if (updatedMarketItem.soldQuantity === updatedMarketItem.quantity) {
      await tx.marketItem.update({
        where: {
          id: marketItem.id,
        },
        data: {
          status: 'SOLD_OUT',
        },
      });

      // 승인되지 않은 나머지 교환 신청 거절
      await tx.exchangeProposal.updateMany({
        where: {
          marketItemId: marketItem.id,
          status: 'WAITING',
        },
        data: {
          status: 'REJECTED',
        },
      });
    }

    return tx.exchangeProposal.findUnique({
      where: {
        id: exchangeId,
      },
      include: {
        offeredCard: true,
        marketItem: {
          include: {
            myCard: true,
          },
        },
      },
    });
  });
};

const reject = async ({ exchangeId, sellerId }) => {
  return prisma.$transaction(async (tx) => {
    const exchange = await tx.exchangeProposal.findUnique({
      where: {
        id: exchangeId,
      },
      include: {
        marketItem: true,
      },
    });

    if (!exchange) {
      throw new AppError(
        '교환 신청을 찾을 수 없습니다.',
        404,
        ERROR_CODES.EXCHANGE_NOT_FOUND,
      );
    }

    if (exchange.marketItem.sellerId !== sellerId) {
      throw new AppError(
        '교환 신청을 거절할 권한이 없습니다.',
        403,
        ERROR_CODES.FORBIDDEN,
      );
    }

    const rejected = await tx.exchangeProposal.updateMany({
      where: {
        id: exchangeId,
        status: 'WAITING',
      },
      data: {
        status: 'REJECTED',
      },
    });

    if (rejected.count === 0) {
      throw new AppError(
        '이미 처리된 교환 신청입니다.',
        409,
        ERROR_CODES.EXCHANGE_NOT_WAITING,
      );
    }

    return tx.exchangeProposal.findUnique({
      where: {
        id: exchangeId,
      },
    });
  });
};

const cancel = async ({ exchangeId, proposerId }) => {
  return prisma.$transaction(async (tx) => {
    const exchange = await tx.exchangeProposal.findUnique({
      where: {
        id: exchangeId,
      },
    });

    if (!exchange) {
      throw new AppError(
        '교환 신청을 찾을 수 없습니다.',
        404,
        ERROR_CODES.EXCHANGE_NOT_FOUND,
      );
    }

    if (exchange.proposerId !== proposerId) {
      throw new AppError(
        '교환 신청을 취소할 권한이 없습니다.',
        403,
        ERROR_CODES.FORBIDDEN,
      );
    }

    const cancelled = await tx.exchangeProposal.updateMany({
      where: {
        id: exchangeId,
        status: 'WAITING',
      },
      data: {
        status: 'CANCELLED',
      },
    });

    if (cancelled.count === 0) {
      throw new AppError(
        '이미 처리된 교환 신청입니다.',
        409,
        ERROR_CODES.EXCHANGE_NOT_WAITING,
      );
    }

    return tx.exchangeProposal.findUnique({
      where: {
        id: exchangeId,
      },
    });
  });
};

export const exchangeRepository = {
  findMarketItem,
  findMyCard,
  getActiveSellingQuantity,
  findWaitingExchange,
  create,
  findSent,
  findReceived,
  approve,
  reject,
  cancel,
};
