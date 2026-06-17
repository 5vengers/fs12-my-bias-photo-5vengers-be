import prisma from '../config/prisma.js';
import { Genre, CardGrade, MarketStatus } from '@prisma/client';

import { PhotoCardLimitError } from '../errors/appError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';

// sold quantity 계산
const countSold = (items) => {
  const count = items
    .filter((item) => item.status === MarketStatus.SELLING)
    .reduce((acc, item) => acc + item.quantity, 0);

  return count;
};

// 내 소유 카드 조회
const findAllMyCards = async (ownerId, keyword, genre, grade, skip, limit) => {
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
  const [cards, total] = await Promise.all([
    prisma.myCard.findMany({
      where,
      select: {
        quantity: true,
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
      skip,
      take: limit,
    }),

    prisma.myCard.count({
      where,
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  const data = cards.map(({ quantity, photoCard, marketItems }) => {
    const soldQuantity = countSold(marketItems);
    return {
      quantity: quantity - soldQuantity,
      ...photoCard,
    };
  });

  return {
    cards: data,
    totalPages,
  };
};

// totalCount 및 gradeCount 조회
const findAllCardCount = async (ownerId) => {
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
  findAllMyCards,
  findAllCardCount,
  createCard,
  findLimits,
};
