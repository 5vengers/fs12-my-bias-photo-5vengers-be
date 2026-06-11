import prisma from '../config/prisma.js';
import { AppError } from '../errors/appError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';

const purchase = async ({ buyerId, marketItemId, quantity }) => {
  return prisma.$transaction(async (tx) => {
    const marketItem = await tx.marketItem.findUnique({
      where: { id: marketItemId },
      include: {
        myCard: {
          select: { id: true, ownerId: true, photoCardId: true },
        },
      },
    });

    if (!marketItem || marketItem.status !== 'SELLING') {
      throw new AppError(
        '현재 판매 중인 포토카드가 아닙니다.',
        409,
        ERROR_CODES.MARKET_ITEM_NOT_SELLING,
      );
    }

    const totalPrice = marketItem.pricePerCard * quantity;

    // 동시 구매가 들어와도 판매 수량을 초과하지 않도록 조건부 갱신
    const updatedStock = await tx.marketItem.updateMany({
      where: {
        id: marketItemId,
        status: 'SELLING',
        quantity: marketItem.quantity,
        pricePerCard: marketItem.pricePerCard,
        soldQuantity: {
          lte: marketItem.quantity - quantity,
        },
      },
      data: {
        soldQuantity: { increment: quantity },
      },
    });

    if (updatedStock.count === 0) {
      throw new AppError(
        '판매 가능한 카드 수량이 부족합니다.',
        409,
        ERROR_CODES.INSUFFICIENT_STOCK,
      );
    }

    // 판매자의 실제 보유 카드 차감
    const decreasedCard = await tx.myCard.updateMany({
      where: {
        id: marketItem.myCardId,
        ownerId: marketItem.sellerId,
        quantity: { gte: quantity },
      },
      data: {
        quantity: { decrement: quantity },
      },
    });

    if (decreasedCard.count === 0) {
      throw new AppError(
        '판매자의 카드 수량이 부족합니다.',
        409,
        ERROR_CODES.INSUFFICIENT_STOCK,
      );
    }

    // 구매자 포인트 조건부 차감
    const deductedPoint = await tx.userPoint.updateMany({
      where: {
        userId: buyerId,
        point: { gte: totalPrice },
      },
      data: {
        point: { decrement: totalPrice },
      },
    });

    if (deductedPoint.count === 0) {
      throw new AppError(
        '보유 포인트가 부족합니다.',
        409,
        ERROR_CODES.INSUFFICIENT_POINTS,
      );
    }

    // 판매자 포인트 지급
    await tx.userPoint.update({
      where: { userId: marketItem.sellerId },
      data: {
        point: { increment: totalPrice },
      },
    });

    // 주문 생성
    const order = await tx.order.create({
      data: {
        buyerId,
        marketItemId,
        quantity,
        totalPrice,
      },
    });

    // 구매자에게 카드 지급
    await tx.myCard.upsert({
      where: {
        ownerId_photoCardId: {
          ownerId: buyerId,
          photoCardId: marketItem.myCard.photoCardId,
        },
      },
      update: {
        quantity: { increment: quantity },
      },
      create: {
        ownerId: buyerId,
        photoCardId: marketItem.myCard.photoCardId,
        quantity,
      },
    });

    const buyerPoint = await tx.userPoint.findUnique({
      where: { userId: buyerId },
    });

    const sellerPoint = await tx.userPoint.findUnique({
      where: { userId: marketItem.sellerId },
    });

    await tx.pointLog.createMany({
      data: [
        {
          userId: buyerId,
          type: 'SPEND',
          amount: -totalPrice,
          balanceAfter: buyerPoint.point,
          referenceType: 'ORDER',
          referenceId: order.id,
          description: '포토카드 구매',
        },
        {
          userId: marketItem.sellerId,
          type: 'EARN',
          amount: totalPrice,
          balanceAfter: sellerPoint.point,
          referenceType: 'SALE',
          referenceId: order.id,
          description: '포토카드 판매',
        },
      ],
    });

    const updatedMarketItem = await tx.marketItem.findUnique({
      where: { id: marketItemId },
    });

    // 모든 판매 수량이 소진된 경우
    if (updatedMarketItem.soldQuantity === updatedMarketItem.quantity) {
      await tx.marketItem.update({
        where: { id: marketItemId },
        data: { status: 'SOLD_OUT' },
      });

      // 아직 확정되지 않은 교환 신청 자동 거절
      await tx.exchangeProposal.updateMany({
        where: {
          marketItemId,
          status: 'WAITING',
        },
        data: {
          status: 'REJECTED',
        },
      });
    }

    return {
      orderId: order.id,
      quantity,
      totalPrice,
      currentPoint: buyerPoint.point,
    };
  });
};

export const orderRepository = { purchase };
