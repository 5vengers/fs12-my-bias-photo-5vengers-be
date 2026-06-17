import { orderRepository } from '../repositories/orderRepository.js';
import { marketRepository } from '../repositories/marketRepository.js';
import { AppError } from '../errors/appError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';
import { notificationService } from './notificationService.js';

const purchase = async ({ buyerId, marketItemId, quantity }) => {
  const marketItem = await marketRepository.findMarketItemById(marketItemId);

  if (!marketItem) {
    throw new AppError(
      '판매글을 찾을 수 없습니다.',
      404,
      ERROR_CODES.MARKET_LISTING_NOT_FOUND,
    );
  }

  if (marketItem.status !== 'SELLING') {
    throw new AppError(
      '현재 판매 중인 포토카드가 아닙니다.',
      409,
      ERROR_CODES.MARKET_ITEM_NOT_SELLING,
    );
  }

  if (marketItem.sellerId === buyerId) {
    throw new AppError(
      '본인이 등록한 포토카드는 구매할 수 없습니다.',
      409,
      ERROR_CODES.CANNOT_BUY_OWN_PHOTO_CARD,
    );
  }

  const remainingQuantity = marketItem.quantity - marketItem.soldQuantity;

  if (remainingQuantity < quantity) {
    throw new AppError(
      '판매 가능한 카드 수량이 부족합니다.',
      409,
      ERROR_CODES.INSUFFICIENT_STOCK,
    );
  }

  const order = await orderRepository.purchase({
    buyerId,
    marketItemId,
    quantity,
  });

  // 알림 전송: 실패해도 구매 결과에 영향 없음
  notificationService
    .notifyPurchase({ buyerId, marketItemId, quantity })
    .catch((err) => console.error('[Notification] notifyPurchase 실패:', err));

  return order;
};

export const orderService = { purchase };
