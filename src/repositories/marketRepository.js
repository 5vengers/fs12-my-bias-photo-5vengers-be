import prisma from '../config/prisma.js';

const buildWhere = ({ grade, genre, soldOut, keyword }) => {
  const where = {
    ...(grade && { grade }),
    ...(genre && { genre }),

    ...(keyword && {
      myCard: {
        photoCard: {
          name: {
            contains: keyword,
            mode: 'insensitive',
          },
        },
      },
    }),
  };

  if (soldOut === 'SELLING' || soldOut === 'SOLD_OUT') {
    where.status = soldOut;
  } else {
    where.status = {
      not: 'DELETED',
    };
  }

  return where;
};
export const marketRepository = {
  //판매 카드 전체 조회
  findMarketItems: async ({
    skip,
    limit,
    grade,
    genre,
    soldOut,
    sort,
    keyword,
  }) => {
    let orderBy = { createdAt: 'desc' };

    switch (sort) {
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;

      case 'priceAsc':
        orderBy = { pricePerCard: 'asc' };
        break;

      case 'priceDesc':
        orderBy = { pricePerCard: 'desc' };
        break;
    }
    const where = buildWhere({
      grade,
      genre,
      soldOut,
      keyword,
    });
    return prisma.marketItem.findMany({
      where,
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
      orderBy,
    });
  },

  //총 개수 조회
  countMarketItems: async ({ grade, genre, soldOut, keyword }) => {
    const where = buildWhere({
      grade,
      genre,
      soldOut,
      keyword,
    });
    return prisma.marketItem.count({
      where,
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
  createMarketItem: async (tx, itemData) => {
    return await tx.marketItem.create({
      data: {
        myCardId: itemData.myCardId,
        quantity: itemData.quantity,
        pricePerCard: itemData.price_per_card,
        grade: itemData.grade,
        genre: itemData.genre,
        wantedGrade: itemData.wanted_grade,
        wantedGenre: itemData.wanted_genre,
        wantedDescription: itemData.wanted_description,
        sellerId: itemData.sellerId,
      },
    });
  },

  //판매 정보 수정
  updateMarketItem: async (tx, itemId, item) => {
    if (item.quantity === undefined) {
      return tx.marketItem.update({
        where: { id: itemId },
        data: item,
      });
    }
    const updated = await tx.marketItem.updateMany({
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

    return tx.marketItem.findUnique({
      where: { id: itemId },
    });
  },

  //판매 글 삭제(상태: DELETED로 업데이트)
  deleteMarketItem: async (tx, currentUserId, marketItemId) => {
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

  //나의 판매 목록 조회
  findMyMarketItems: async (userId) => {
    return await prisma.marketItem.findMany({
      where: {
        sellerId: userId,
        NOT: { status: 'DELETED' },
      },
      include: {
        myCard: {
          include: {
            photoCard: {
              include: { creator: { select: { nickname: true } } },
            },
          },
        },
        exchangeProposals: {
          where: { status: 'WAITING' },
          select: { id: true },
        },
      },
      orderBy: { id: 'asc' },
    });
  },

  //내 카드 조회
  findMyCard: async (tx, myCardId) => {
    return await tx.myCard.findUnique({
      where: { id: myCardId },
      include: {
        photoCard: true,
      },
    });
  },

  //내 판매 카드 수량 조회
  findActiveMarketItems: async (tx, myCardId) => {
    return await tx.marketItem.findMany({
      where: {
        myCardId: myCardId,
        status: 'SELLING',
      },
    });
  },
};
