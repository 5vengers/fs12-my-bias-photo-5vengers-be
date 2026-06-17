import prisma from '../config/prisma.js';

export const marketRepository = {
  //판매 카드 전체 조회
  findMarketItems: async (skip, limit) => {
    return await prisma.marketItem.findMany({
      where: {
        status: {
          not: 'DELETED',
        },
      },
      include: {
        seller: true,
        myCard: {
          include: {
            photoCard: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });
  },
  //총 개수 조회
  countMarketItems: async () => {
    return prisma.marketItem.count({
      where: {
        status: {
          not: 'DELETED',
        },
      },
    });
  },

  //판매 카드 상세 조회
  findMarketItemById: async (marketItemId) => {
    return await prisma.marketItem.findFirst({
      where: {
        id: marketItemId,
        status: {
          not: 'DELETED',
        },
      },
      include: {
        seller: true,
        myCard: {
          include: {
            photoCard: true,
          },
        },
      },
    });
  },

  //판매 등록
  createMarketItem: async (itemData) => {
    return await prisma.marketItem.create({
      data: {
        myCardId: itemData.myCardId,
        quantity: itemData.quantity,
        pricePerCard: itemData.price_per_card,
        grade: itemData.wanted_grade,
        genre: itemData.wanted_genre,
        wantedDescription: itemData.wanted_description,
        sellerId: itemData.sellerId,
      },
    });
  },

  //판매 정보 수정
  updateMarketItem: async (itemId, item) => {
    if (item.quantity === undefined) {
      return prisma.marketItem.update({
        where: { id: itemId },
        data: item,
      });
    }
    const updated = await prisma.marketItem.updateMany({
      where: {
        id: itemId,
        status: 'SELLING',
        soldQuantity: {
          lte: item.quantity,
        },
      },
      data: item,
    });

    if (updated.count === 0) {
      return null;
    }

    return prisma.marketItem.findUnique({
      where: { id: itemId },
    });
  },

  //판매 글 삭제(상태: DELETED로 업데이트)
  deleteMarketItem: async (marketItemId) => {
    return prisma.$transaction(async (tx) => {
      const deletedItem = await tx.marketItem.update({
        where: { id: marketItemId },
        data: { status: 'DELETED' },
      });

      await tx.exchangeProposal.updateMany({
        where: { marketItemId, status: 'WAITING' },
        data: { status: 'REJECTED' },
      });

      return deletedItem;
    });
  },

  //내 카드 조회 (마이프로필과 로직 중복시 삭제 예정)
  findMyCard: async (myCardId) => {
    return await prisma.myCard.findUnique({
      where: { id: myCardId },
    });
  },

  //내 판매 카드 수량 조회
  findActiveMarketItems: async (myCardId) => {
    return await prisma.marketItem.findMany({
      where: {
        myCardId: myCardId,
        status: 'SELLING',
      },
    });
  },
};
