import prisma from '../config/prisma.js';

// 내 소유 카드 조회
const findAllMyCards = async (ownerId) => {
  // 기본 카드 조회
  const cards = await prisma.myCard.findMany({
    where: {
      ownerId,
    },
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
    },
  });

  // 필터링 : genre, grade, keyword

  // 페이지네이션

  return cards;
};

// 포토 카드 생성
const createCard = async (userId, cardData, nowDate) => {
  const { year, month } = nowDate;
  const { name, description, genre, grade, price, totalQuantity, imageUrl } =
    cardData;
  // photocard 와 동시에 mycard, creationLog 에 값 생성을 위해 트랜잭션 적용
  const result = await prisma.$transaction(async (tx) => {
    const photoCard = await prisma.photoCard.create({
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

    const myCard = await prisma.myCard.create({
      data: {
        ownerId: userId,
        photoCardId: photoCard.id,
        quantity: photoCard.totalQuantity,
      },
    });

    const log = await prisma.cardCreationLog.upsert({
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
  });

  return result;
};

// 마이갤러리 포토카드 생성 버튼에 들어갈 count 값 조회
const findLimits = async (userId, year, month) => {
  const limits = await prisma.cardCreationLog.findMany({
    where: {
      userId,
      year,
      month,
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
  createCard,
  findLimits,
};
