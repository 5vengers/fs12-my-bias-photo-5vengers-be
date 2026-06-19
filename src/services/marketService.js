import { marketRepository } from '../repositories/marketRepository.js';
import { AppError } from '../errors/appError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';

//최대 카드 등록 상한선
const calculateMaxAvailableQuantity = async (
  marketItemId,
  myCardId,
  userId,
  soldQuantity = 0,
) => {
  const myCard = await marketRepository.findMyCard(myCardId);
  if (!myCard) {
    throw new AppError(
      '보유하고 있지 않은 카드입니다.',
      404,
      ERROR_CODES.NOT_FOUND,
    );
  }

  if (myCard.ownerId !== userId) {
    throw new AppError(
      '해당 카드에 대한 접근 권한이 없습니다.',
      403,
      ERROR_CODES.FORBIDDEN,
    );
  }

  const activeListings = await marketRepository.findActiveMarketItems(
    myCard.id,
  );
  const otherSellingQuantity = activeListings
    .filter((item) => item.id !== Number(marketItemId))
    .reduce((sum, item) => sum + (item.quantity - item.soldQuantity), 0);

  return soldQuantity + myCard.quantity - otherSellingQuantity;
};

// 판매 카드 목록 조회
export const marketService = {
  getMarketItems: async ({
    page,
    limit,
    grade,
    genre,
    soldOut,
    sort,
    keyword,
  }) => {
    const skip = (page - 1) * limit;

    const items = await marketRepository.findMarketItems({
      skip,
      limit,
      grade,
      genre,
      soldOut,
      sort,
      keyword,
    });
    const totalCount = await marketRepository.countMarketItems({
      grade,
      genre,
      soldOut,
      keyword,
    });

    const hasNext = skip + items.length < totalCount;

    return {
      items: items.map((item) => ({
        id: item.id,

        // 카드 정보 (핵심)
        imageUrl: item.myCard.photoCard.imageUrl ?? null,
        title: item.myCard.photoCard.name ?? '',

        // 판매 정보
        pricePerCard: item.pricePerCard,
        quantity: item.quantity,
        soldQuantity: item.soldQuantity,

        // 상태
        status: item.status,
        grade: item.grade,
        genre: item.genre,

        // 판매자
        sellerNickname: item.seller.nickname ?? 'unknown',

        createdAt: item.createdAt,
      })),

      hasNext,
      nextPage: hasNext ? page + 1 : undefined,
    };
  },

  // 상세 조회
  getMarketItemDetail: async (itemId) => {
    const item = await marketRepository.findMarketItemById(itemId);

    if (!item) {
      throw new AppError(
        '해당 마켓 등록 건을 찾을 수 없습니다.',
        404,
        ERROR_CODES.MARKET_LISTING_NOT_FOUND,
      );
    }

    return {
      id: item.id,

      // 카드 정보
      imageUrl: item.myCard.photoCard.imageUrl ?? null,
      title: item.myCard.photoCard.name ?? '',
      description: item.myCard.photoCard.description ?? '',
      grade: item.grade,
      genre: item.genre,

      // 판매 정보
      pricePerCard: item.pricePerCard,
      quantity: item.quantity,
      soldQuantity: item.soldQuantity,
      status: item.status,

      // 판매자 정보
      sellerId: item.sellerId,
      sellerNickname: item.seller.nickname ?? 'unknown',

      // 교환 희망 정보
      wantedGrade: item.wantedGrade,
      wantedGenre: item.wantedGenre,
      wantedDescription: item.wantedDescription ?? '',

      createdAt: item.createdAt,
    };
  },

  //판매글 생성
  registerMarketItem: async (userId, itemData) => {
    const maxAvailableQuantity = await calculateMaxAvailableQuantity(
      null,
      itemData.myCardId,
      userId,
    );

    if (itemData.quantity > maxAvailableQuantity) {
      throw new AppError(
        '보유 수량보다 많은 수를 등록할 수 없습니다.',
        400,
        ERROR_CODES.VALIDATION_ERROR,
      );
    }
    return marketRepository.createMarketItem({ ...itemData, sellerId: userId });
  },

  updateMarketItem: async (currentUserId, marketItemId, updateData) => {
    const marketItem = await marketRepository.findMarketItemById(marketItemId);
    if (!marketItem) {
      throw new AppError(
        '존재하지 않는 판매글입니다.',
        404,
        ERROR_CODES.NOT_FOUND,
      );
    }

    //본인 확인
    if (currentUserId !== marketItem.sellerId) {
      throw new AppError(
        '작성자 수정 권한이 없습니다.',
        403,
        ERROR_CODES.FORBIDDEN,
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
      currentUserId,
      marketItem.soldQuantity,
    );

    if (updateData.quantity > maxAvailableQuantity) {
      throw new AppError(
        '보유 수량보다 많은 수를 판매할 수 없습니다.',
        400,
        ERROR_CODES.VALIDATION_ERROR,
      );
    }

    const updatedMarketItem = await marketRepository.updateMarketItem(
      marketItemId,
      updateData,
    );

    if (!updatedMarketItem) {
      throw new AppError(
        '이미 판매된 수량보다 판매 수량을 줄일 수 없습니다.',
        409,
        ERROR_CODES.INSUFFICIENT_STOCK,
      );
    }

    return updatedMarketItem;
  },

  deleteMarketItem: async (currentUserId, marketItemId) => {
    const marketItem = await marketRepository.findMarketItemById(marketItemId);
    if (!marketItem) {
      throw new AppError(
        '존재하지 않는 판매 글입니다.',
        404,
        ERROR_CODES.NOT_FOUND,
      );
    }
    if (marketItem.status === 'DELETED') {
      throw new AppError(
        '이미 삭제된 판매글입니다.',
        400,
        ERROR_CODES.VALIDATION_ERROR,
      );
    }

    if (currentUserId !== marketItem.sellerId) {
      throw new AppError('삭제 권한이 없습니다.', 403, ERROR_CODES.FORBIDDEN);
    }

    const availableQuantity = marketItem.quantity - marketItem.soldQuantity;

    if (availableQuantity < 0) {
      throw new AppError(
        '서버 데이터에 오류 발생, 판매 수량을 초과한 거래가 존재합니다.',
        500,
        ERROR_CODES.INTERNAL_ERROR,
      );
    }
    //삭제 연산 호출
    return await marketRepository.deleteMarketItem(marketItemId);
  },

  //등록가능 최대수
  getMyCardMaxQuantity: async (userId, myCardId) => {
    console.log('서비스로 전달된 userId:', userId);
    console.log('서비스로 전달된 myCardId:', myCardId);
    const myCard = await marketRepository.findMyCard(myCardId);
    if (myCard) {
      console.log('DB에서 찾은 카드의 ownerId:', myCard.ownerId);
    }
    if (!myCard) {
      throw new AppError(
        '보유하고 있지 않은 카드입니다.',
        404,
        ERROR_CODES.NOT_FOUND,
      );
    }

    if (myCard.ownerId !== userId) {
      throw new AppError(
        '해당 카드에 대한 접근 권한이 없습니다.',
        403,
        ERROR_CODES.FORBIDDEN,
      );
    }

    const activeMarketItems =
      await marketRepository.findActiveMarketItems(myCardId);

    if (!Array.isArray(activeMarketItems)) {
      throw new AppError(
        '서버 데이터 조회 중 오류가 발생했습니다.',
        500,
        ERROR_CODES.INTERNAL_ERROR,
      );
    }

    const usedQuantity = activeMarketItems.reduce((sum, item) => {
      if (!item) return sum;

      const available = (item.quantity ?? 0) - (item.soldQuantity ?? 0);

      if (available < 0) {
        throw new AppError(
          '서버 데이터에 오류 발생, 판매 수량을 초과한 거래가 존재합니다.',
          500,
          ERROR_CODES.INTERNAL_ERROR,
        );
      }

      return sum + available;
    }, 0);

    const result = myCard.quantity - usedQuantity;

    if (result < 0) {
      throw new AppError(
        '서버 데이터에 오류 발생, 계산된 최대 수량이 음수입니다.',
        500,
        ERROR_CODES.INTERNAL_ERROR,
      );
    }

    return result;
  },
};
