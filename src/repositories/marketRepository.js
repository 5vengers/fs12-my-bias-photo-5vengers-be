import prisma from '../config/prisma.js';

export const marketRepository = {
  //판매 카드 전체 조회
  findMarketItems: async () => {
    return await prisma.marketItem.findMany({
      include: {
        myCard: {
          include: { photoCard: true },
        },
      },
    });
  },

  //판매 카드 상세 조회
  findMarketItemById: async (itemId) => {
    return await prisma.marketItem.findUnique({
      where: {
        id: itemId,
      },
      include: {
        myCard: {
          include: { photoCard: true },
        },
      },
    });
  },

  //판매 등록
  createMarketItem: async (itemData) => {
    return await prisma.marketItem.create({
      data: itemData,
    });
  },

  //판매 정보 수정
  updateMarketItem: async (itemId, item) => {
    return await prisma.marketItem.update({
      where: { id: itemId },
      data: item,
    });
  },
  //판매 글 삭제(상태: DELETED 로 업데이트 처리 후 남은 수량 롤백처리)
  deleteMarketItemAndRollbackCard: async (
    marketItemId,
    myCardId,
    rollbackQuantity,
  ) => {
    //트랜잭션 처리
    return await prisma.$transaction(async (tx) => {
      if (rollbackQuantity > 0) {
        await tx.myCard.update({
          where: { id: myCardId },
          data: {
            quantity: { increment: rollbackQuantity },
          },
        });
      }

      const deletedItem = await tx.marketItem.update({
        where: { id: marketItemId },
        data: { status: 'DELETED' }, // 상태를 DELETED로 변경
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

  //나의 판매 목록 조회
  findMyMarketItems: async (userId) => {
    return await prisma.marketItem.findMany({
      where: {
        sellerId: userId,
        NOT: { status: 'DELETED' },
      },
      include: {
        myCard: {
          include: { photoCard: true },
        },
        exchangeProposals: {
          where: { status: 'WAITING' },
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
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
