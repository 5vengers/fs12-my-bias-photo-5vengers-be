import { myCardRepository } from '../repositories/myCardRepository.js';
import { PhotoCardNotFoundError } from '../errors/appError.js';

export const myCardService = {
  // 나의 포토카드 전체 조회
  getMyCards: async (userId) => {
    return await myCardRepository.findMyCards(userId);
  },

  // 나의 포토카드 단건 조회
  getMyCardById: async (myCardId, userId) => {
    const card = await myCardRepository.findMyCardById(myCardId, userId);
    if (!card) {
      throw new PhotoCardNotFoundError();
    }
    return card;
  },
};
