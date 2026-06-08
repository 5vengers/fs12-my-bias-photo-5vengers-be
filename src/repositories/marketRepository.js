import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const marketRepository = {
  //판매 카드 전체 조회
  findMarketItems: async () => {
    return await prisma.marketItem.findMany();
  },

  //판매 카드 상세 조회
  findMarketItemById: async (itemId) => {
    return await prisma.marketItem.findUnique({
      where: {
        id: itemId,
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
  //판매 글 삭제
  deleteMarketItem: async (itemId) => {
    return await prisma.marketItem.delete({
      where: { id: itemId },
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
