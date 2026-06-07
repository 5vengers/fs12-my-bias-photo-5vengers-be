import { marketRepository } from '../repositories/marketRepository';

export const marketService = {
  getMarketItems: async () => {
    return await marketRepository.findMarketItems();
  },
  getMarketItemDetail: async (itemId) => {
    const item = await marketRepository.findMarketItemById(itemId);
    if (!item) {
      throw new Error('존재하지 않는 판매글입니다.');
    }
    return item;
  },
  registerMarketItem: async (itemData) => {
    return await marketRepository.createMarketItem(itemData);
  },
  updateMarketItem: async (itemId, itemData, currentUserId) => {
    // TODO: 판매자 검증 로직 추가 예정
    return await marketRepository.updateMarketItem(itemId, itemData);
  },
  deleteMarketItem: async (itemId, currentUserId) => {
    // TODO: 판매자 검증 로직 추가 예정
    return await marketRepository.deleteMarketItem(itemId);
  },
};
