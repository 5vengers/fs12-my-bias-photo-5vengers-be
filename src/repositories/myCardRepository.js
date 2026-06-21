import prisma from '../config/prisma.js';
import { Genre, CardGrade, MarketStatus, ExchangeStatus } from '@prisma/client';

import { PhotoCardLimitError } from '../errors/appError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';

// sold quantity 계산
const countSold = (items) => {
  const count = items
    .filter((item) => item.status === MarketStatus.SELLING)
    .reduce((acc, item) => acc + item.quantity, 0);

  return count;
};

// totalPage 계산
const pageCount = (arr, skip, limit) => {
  const total = arr.length;
  const data = arr.slice(skip, skip + limit);

  const totalPages = Math.ceil(total / limit);

  return {
    pagedData: data,
    totalPages,
  };
};

// 내 소유 카드 조회
const findGalleryCards = async (
  ownerId,
  keyword,
  genre,
  grade,
  skip,
  limit,
) => {
  // 필터링 : genre, grade, keyword
  // keyword 처리 후 genre, grade 처리
  // genre, grade enum 처리
  const genreValue = Object.values(Genre).includes(genre) ? genre : undefined;
  const gradeValue = Object.values(CardGrade).includes(grade)
    ? grade
    : undefined;

  const where = {
    ownerId,

    photoCard: {
      ...(keyword && {
        OR: [
          { name: { contains: keyword } },
          { description: { contains: keyword } },
        ],
      }),
      ...(genre && { genre: genreValue }),
      ...(grade && { grade: gradeValue }),
    },
  };

  // 기본 카드 조회
  const allCards = await prisma.myCard.findMany({
    orderBy: {
      acquiredAt: 'desc',
    },
    where,
    select: {
      id: true,
      quantity: true,

      owner: {
        select: {
          nickname: true,
        },
      },

      photoCard: {
        select: {
          name: true,
          description: true,
          genre: true,
          grade: true,
          price: true,
          imageUrl: true,
        },
      },
      marketItems: {
        select: {
          quantity: true,
          status: true,
        },
        where: {
          status: MarketStatus.SELLING,
        },
      },
    },
  });

  const filteredCards = allCards.filter(({ quantity, marketItems }) => {
    return quantity - countSold(marketItems) > 0;
  });

  const { totalPages, pagedData } = pageCount(filteredCards, skip, limit);

  const data = pagedData.map(
    ({ quantity, photoCard, marketItems, id, owner }) => {
      const soldQuantity = countSold(marketItems);

      return {
        id,
        quantity: quantity - soldQuantity,
        nickname: owner.nickname,
        ...photoCard,
      };
    },
  );

  return {
    cards: data,
    totalPages,
  };
};

// totalCount 및 gradeCount 조회
const findGalleryCount = async (ownerId) => {
  const allCards = await prisma.myCard.findMany({
    where: {
      ownerId,
    },
    select: {
      quantity: true,
      photoCard: {
        select: {
          grade: true,
        },
      },
      marketItems: {
        select: {
          quantity: true,
          status: true,
        },
        where: {
          status: MarketStatus.SELLING,
        },
      },
    },
  });

  const totalCount = allCards.reduce((acc, { quantity, marketItems }) => {
    const soldQuantity = countSold(marketItems);
    acc += quantity - soldQuantity;
    return acc;
  }, 0);

  const gradeCount = allCards.reduce(
    (acc, { quantity, photoCard, marketItems }) => {
      const soldQuantity = countSold(marketItems);
      // acc 를 등급 객체로 만들어 관리하는데 해당 값이 없으면 0 처리
      acc[photoCard.grade] =
        (acc[photoCard.grade] || 0) + (quantity - soldQuantity);
      return acc;
    },
    {},
  );

  return {
    totalCount,
    gradeCount,
  };
};

const SALE_TYPE = {
  SELLING: 'SELLING',
  EXCHANGE: 'EXCHANGE',
};

// 판매 포토카드 조회
const findSalesCards = async (
  userId,
  keyword,
  genre,
  grade,
  saleType,
  isSoldOut,
  skip,
  limit,
) => {
  // 필터링 : genre, grade, tradeType, isSoldOut, keyword
  // keyword 처리 후 genre, grade, tradeType, isSoldOut 처리
  // genre, grade enum 처리
  const genreValue = Object.values(Genre).includes(genre) ? genre : undefined;
  const gradeValue = Object.values(CardGrade).includes(grade)
    ? grade
    : undefined;
  const saleTypeValue = Object.values(SALE_TYPE).includes(saleType)
    ? saleType
    : undefined;

  const cardFilter = {
    ...(keyword && {
      OR: [
        { name: { contains: keyword } },
        { description: { contains: keyword } },
      ],
    }),
    ...(genreValue && { genre: genreValue }),
    ...(gradeValue && { grade: gradeValue }),
  };

  const [marketItems, exchangeProposals] = await Promise.all([
    // 판매 중
    saleTypeValue !== SALE_TYPE.EXCHANGE
      ? prisma.marketItem.findMany({
          where: {
            sellerId: userId,
            status: MarketStatus.SELLING,
            myCard: { photoCard: cardFilter },
          },
          select: {
            id: true,
            pricePerCard: true,
            quantity: true,
            soldQuantity: true,
            createdAt: true,
            seller: {
              select: {
                nickname: true,
              },
            },
            myCard: {
              select: {
                photoCard: {
                  select: {
                    name: true,
                    grade: true,
                    genre: true,
                    price: true,
                    imageUrl: true,
                  },
                },
              },
            },
          },
        })
      : [],

    // 교환제시
    saleTypeValue !== SALE_TYPE.SELLING
      ? prisma.exchangeProposal.findMany({
          where: {
            proposerId: userId,
            status: ExchangeStatus.WAITING,
            offeredCard: { photoCard: cardFilter },
          },
          select: {
            id: true,
            createdAt: true,
            offeredCard: {
              select: {
                owner: {
                  select: {
                    nickname: true,
                  },
                },
                photoCard: {
                  select: {
                    name: true,
                    grade: true,
                    genre: true,
                    price: true,
                    imageUrl: true,
                  },
                },
              },
            },
          },
        })
      : [],
  ]);

  const sellingData = marketItems.map(
    ({ myCard, seller, quantity, soldQuantity, ...rest }) => ({
      id: rest.id,
      saleType: SALE_TYPE.SELLING,
      pricePerCard: rest.pricePerCard,
      remainingQuantity: quantity - soldQuantity,
      createdAt: rest.createdAt,
      nickname: seller.nickname,
      ...myCard.photoCard,
    }),
  );

  if (isSoldOut !== undefined) {
    const filterdData = isSoldOut
      ? sellingData.filter((c) => c.remainingQuantity === 0)
      : sellingData.filter((c) => c.remainingQuantity !== 0);

    const { totalPages, pagedData } = pageCount(filterdData, skip, limit);

    return {
      cards: pagedData,
      totalPages,
    };
  }

  const exchangeData = exchangeProposals.map(({ offeredCard, ...rest }) => ({
    id: rest.id,
    saleType: SALE_TYPE.EXCHANGE,
    pricePerCard: null,
    remainingQuantity: 1,
    createdAt: rest.createdAt,
    nickname: offeredCard.owner.nickname,
    ...offeredCard.photoCard,
  }));

  const merged = [...sellingData, ...exchangeData].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );

  const total = merged.length;
  const data = merged.slice(skip, skip + limit);

  const totalPages = Math.ceil(total / limit);

  return {
    cards: data,
    totalPages,
  };
};

const findSalesCount = async (userId) => {
  const [marketItems, exchangeProposals] = await Promise.all([
    prisma.marketItem.findMany({
      where: {
        sellerId: userId,
        status: MarketStatus.SELLING,
      },
      select: {
        quantity: true,
        soldQuantity: true,
        myCard: {
          select: {
            photoCard: {
              select: { grade: true },
            },
          },
        },
      },
    }),

    prisma.exchangeProposal.findMany({
      where: {
        proposerId: userId,
        status: ExchangeStatus.WAITING,
      },
      select: {
        offeredCard: {
          select: {
            photoCard: {
              select: { grade: true },
            },
          },
        },
      },
    }),
  ]);

  const sellingGrades = marketItems.map(
    ({ quantity, soldQuantity, myCard }) => ({
      grade: myCard.photoCard.grade,
      count: quantity - soldQuantity,
    }),
  );

  const exchangeGrades = exchangeProposals.map(({ offeredCard }) => ({
    grade: offeredCard.photoCard.grade,
    count: 1,
  }));

  const allCards = [...sellingGrades, ...exchangeGrades];

  const totalCount = allCards.reduce((acc, { count }) => acc + count, 0);

  const gradeCount = allCards.reduce((acc, { grade, count }) => {
    const soldQuantity = countSold(marketItems);
    // acc 를 등급 객체로 만들어 관리하는데 해당 값이 없으면 0 처리
    acc[grade] = (acc[grade] || 0) + count;
    return acc;
  }, {});

  return { totalCount, gradeCount };
};

// 포토 카드 생성
const createCard = async (userId, imageUrl, cardData, nowDate) => {
  const { year, month } = nowDate;
  const { name, description, genre, grade, price, totalQuantity } = cardData;

  // photocard 와 동시에 mycard, creationLog 에 값 생성을 위해 트랜잭션 적용
  const result = await prisma.$transaction(async (tx) => {
    const photoCard = await tx.photoCard.create({
      data: {
        creatorId: userId,
        name,
        description,
        genre,
        grade,
        price: Number(price),
        totalQuantity: Number(totalQuantity),
        imageUrl,
      },
    });

    const myCard = await tx.myCard.create({
      data: {
        ownerId: userId,
        photoCardId: photoCard.id,
        quantity: photoCard.totalQuantity,
      },
    });

    const log = await tx.cardCreationLog.upsert({
      where: {
        userId_year_month: { userId, year, month },
      },
      create: {
        userId,
        year,
        month,
        count: 1,
      },
      update: {
        count: { increment: 1 },
      },
    });

    if (log.count > 3) {
      throw new PhotoCardLimitError();
    }

    const createdCard = {
      name: photoCard.name,
      description: photoCard.description,
      genre: photoCard.genre,
      grade: photoCard.grade,
      price: photoCard.price,
      quantity: myCard.quantity,
    };

    return createdCard;
  });

  return result;
};

// 마이갤러리 포토카드 생성 버튼에 들어갈 count 값 조회
const findLimits = async (userId, year, month) => {
  const limits = await prisma.cardCreationLog.findUnique({
    where: {
      userId_year_month: { userId, year, month },
    },
    select: {
      id: true,
      year: true,
      month: true,
      count: true,
    },
  });

  return limits;
};

export default {
  findGalleryCards,
  findGalleryCount,
  findSalesCards,
  findSalesCount,
  createCard,
  findLimits,
};
