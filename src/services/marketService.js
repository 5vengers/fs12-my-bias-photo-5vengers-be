import { marketRepository } from '../repositories/marketRepository.js';
import { AppError } from '../errors/appError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';

//최대 카드 설정 상한선
const calculateMaxAvailableQuantity = async (marketItemId, myCardId) => {
  //내 카드 보유량 조회
  const myCard = await marketRepository.findMyCard(myCardId);
  if (!myCard) {
    throw new AppError(
      '보유하고 있지 않은 카드입니다.',
      404,
      ERROR_CODES.NOT_FOUND,
    );
  }

  const activeListings = await marketRepository.findActiveMarketItems(
    myCard.id,
  );
  const otherSellingQuantity = activeListings
    .filter((item) => item.id !== Number(marketItemId))
    .reduce((sum, item) => sum + (item.quantity - item.soldQuantity), 0);

  return myCard.quantity - otherSellingQuantity;
};

export const marketService = {
  getMarketItems: async () => {
    return await marketRepository.findMarketItems();
  },

  getMarketItemDetail: async (itemId) => {
    const item = await marketRepository.findMarketItemById(itemId);
    if (!item) {
      throw new AppError(
        '해당 마켓 등록 건을 찾을 수 없습니다.',
        404,
        ERROR_CODES.MARKET_LISTING_NOT_FOUND,
      );
    }
    return item;
  },

  registerMarketItem: async (itemData) => {
    const maxAvailableQuantity = await calculateMaxAvailableQuantity(
      null,
      itemData.myCardId,
    );

    if (itemData.quantity > maxAvailableQuantity) {
      throw new AppError(
        '보유 수량보다 많은 수를 등록할 수 없습니다.',
        400,
        ERROR_CODES.VALIDATION_ERROR,
      );
    }
    return marketRepository.createMarketItem(itemData);
  },

  updateMarketItem: async (marketItemId, updateData, currentUserId) => {
    // TODO: 판매자 검증 로직 추가 예정

    const marketItem = await marketRepository.findMarketItemById(marketItemId);
    if (!marketItem) {
      throw new AppError(
        '존재하지 않는 판매글입니다.',
        404,
        ERROR_CODES.NOT_FOUND,
      );
    }
    //수량 하한선 체크
    if (updateData.quantity < marketItem.soldQuantity) {
      throw new AppError(
        `이미 ${marketItem.soldQuantity}장이 판매 완료되어, 전체 수량을 그 미만으로 줄일 수 없습니다.`,
        400,
        ERROR_CODES.VALIDATION_ERROR,
      );
    }
    //수량 상한선 체크
    const maxAvailableQuantity = await calculateMaxAvailableQuantity(
      marketItemId,
      marketItem.myCardId,
    );

    if (updateData.quantity > maxAvailableQuantity) {
      throw new AppError(
        '보유 수량보다 많은 수를 등록할 수 없습니다.',
        400,
        ERROR_CODES.VALIDATION_ERROR,
      );
    }

    return await marketRepository.updateMarketItem(marketItemId, updateData);
  },

  deleteMarketItem: async (marketItemId, currentUserId) => {
    const marketItem = await marketRepository.findMarketItemById(marketItemId);
    if (!marketItem) {
      throw new AppError(
        '존재하지 않는 판매 글입니다.',
        404,
        ERROR_CODES.NOT_FOUND,
      );
    }
    // TODO: 판매자 검증 로직 추가 예정

    const availableQuantity = marketItem.quantity - marketItem.soldQuantity;

    if (availableQuantity < 0) {
      throw new AppError(
        '서버 데이터에 오류 발생, 판매 수량을 초과한 거래가 존재합니다.',
        500,
        ERROR_CODES.INTERNAL_ERROR,
      );
    }
    //남은 수량 다시 내 카드 수량으로 채워짐
    //db에서 진짜 삭제 or 상태값만 바꾸기
    return await marketRepository.deleteMarketItem(marketItemId);
  },
};
