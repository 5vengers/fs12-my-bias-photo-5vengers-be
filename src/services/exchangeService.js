import { exchangeRepository } from '../repositories/exchangeRepository.js';
import { AppError } from '../errors/appError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';

const create = async ({ proposerId, marketItemId, offeredCardId }) => {
  const marketItem = await exchangeRepository.findMarketItem(marketItemId);

  if (!marketItem || marketItem.status !== 'SELLING') {
    throw new AppError(
      '현재 교환 가능한 판매글이 아닙니다.',
      409,
      ERROR_CODES.MARKET_ITEM_NOT_SELLING,
    );
  }

  if (marketItem.sellerId === proposerId) {
    throw new AppError(
      '본인의 판매글에는 교환을 신청할 수 없습니다.',
      409,
      ERROR_CODES.CANNOT_EXCHANGE_OWN_CARD,
    );
  }

  const offeredCard = await exchangeRepository.findMyCard(offeredCardId);

  if (!offeredCard || offeredCard.ownerId !== proposerId) {
    throw new AppError(
      '제안할 카드의 소유자가 아닙니다.',
      403,
      ERROR_CODES.FORBIDDEN,
    );
  }

  if (offeredCard.photoCardId === marketItem.myCard.photoCardId) {
    throw new AppError(
      '같은 종류의 카드는 교환할 수 없습니다.',
      409,
      ERROR_CODES.CANNOT_EXCHANGE_SAME_CARD,
    );
  }

  const sellingQuantity =
    await exchangeRepository.getActiveSellingQuantity(offeredCardId);

  if (offeredCard.quantity - sellingQuantity < 1) {
    throw new AppError(
      '판매 중인 수량을 제외하면 교환 가능한 카드가 없습니다.',
      409,
      ERROR_CODES.INSUFFICIENT_EXCHANGE_CARD,
    );
  }

  const duplicate = await exchangeRepository.findWaitingExchange(
    marketItemId,
    proposerId,
  );

  if (duplicate) {
    throw new AppError(
      '이미 대기 중인 교환 신청이 있습니다.',
      409,
      ERROR_CODES.DUPLICATE_EXCHANGE,
    );
  }

  return exchangeRepository.create({
    proposerId,
    marketItemId,
    offeredCardId,
  });
};

const findSent = (userId) => exchangeRepository.findSent(userId);
const findReceived = (userId) => exchangeRepository.findReceived(userId);

const approve = ({ exchangeId, sellerId }) =>
  exchangeRepository.approve({ exchangeId, sellerId });

export const exchangeService = {
  create,
  findSent,
  findReceived,
  approve,
};
