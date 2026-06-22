import { exchangeRepository } from '../repositories/exchangeRepository.js';
import { notificationService } from './notificationService.js';
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

  const proposal = await exchangeRepository.create({
    proposerId,
    marketItemId,
    offeredCardId,
  });

  notificationService
    .notifyTradeRequest(proposal.id)
    .catch((err) =>
      console.error('[Notification] notifyTradeRequest 실패:', err),
    );

  return proposal;
};

const findSent = (userId) => exchangeRepository.findSent(userId);
const findReceived = (userId) => exchangeRepository.findReceived(userId);

const approve = async ({ exchangeId, sellerId }) => {
  const result = await exchangeRepository.approve({ exchangeId, sellerId });

  notificationService
    .notifyTradeApproved(exchangeId, result.autoRejectedIds)
    .catch((err) =>
      console.error('[Notification] notifyTradeApproved 실패:', err),
    );

  return result.proposal;
};

const reject = async ({ exchangeId, sellerId }) => {
  const result = await exchangeRepository.reject({ exchangeId, sellerId });

  notificationService
    .notifyTradeRejected(exchangeId)
    .catch((err) =>
      console.error('[Notification] notifyTradeRejected 실패:', err),
    );

  return result;
};

const cancel = ({ exchangeId, proposerId }) =>
  exchangeRepository.cancel({ exchangeId, proposerId });

const findOne = async ({ exchangeId, userId }) => {
  const proposal = await exchangeRepository.findById(exchangeId);

  if (!proposal) {
    throw new AppError(
      '교환 신청을 찾을 수 없습니다.',
      404,
      ERROR_CODES.EXCHANGE_NOT_FOUND,
    );
  }

  const isProposer = proposal.proposerId === userId;
  const isSeller = proposal.marketItem.sellerId === userId;

  if (!isProposer && !isSeller) {
    throw new AppError(
      '해당 교환 신청에 접근할 권한이 없습니다.',
      403,
      ERROR_CODES.FORBIDDEN,
    );
  }

  return { marketItemId: proposal.marketItemId };
};

export const exchangeService = {
  create,
  findSent,
  findReceived,
  approve,
  reject,
  cancel,
  findOne,
};
