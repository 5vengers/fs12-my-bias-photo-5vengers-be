import prisma from '../config/prisma.js';

export const myCardRepository = {
  // 나의 포토카드 전체 조회 (photoCard 정보 포함)
  findMyCards: async (userId) => {
    return await prisma.myCard.findMany({
      where: { ownerId: userId },
      include: {
        photoCard: true,
      },
      orderBy: { acquiredAt: 'desc' },
    });
  },

  // 나의 포토카드 단건 조회
  findMyCardById: async (myCardId, userId) => {
    return await prisma.myCard.findFirst({
      where: { id: myCardId, ownerId: userId },
      include: {
        photoCard: true,
      },
    });
  },
};
