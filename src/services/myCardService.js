import { myCardRepository } from '../repositories/myCardRepository.js';
import { AppError } from '../errors/appError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';

export const myCardService = {
  // 나의 포토카드 전체 조회
  getMyCards: async (userId) => {
    return await myCardRepository.findMyCards(userId);
  },

  // 나의 포토카드 단건 조회
  getMyCardById: async (myCardId, userId) => {
    const card = await myCardRepository.findMyCardById(myCardId, userId);
    if (!card) {
      throw new AppError(
        '해당 포토카드를 찾을 수 없습니다.',
        404,
        ERROR_CODES.NOT_FOUND,
      );
    }
    return card;
  },
};
