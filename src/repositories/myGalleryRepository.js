import prisma from '../config/prisma.js';
import { Genre, CardGrade } from '@prisma/client';

import { AppError, PhotoCardLimitError } from '../errors/appError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';

// 내 소유 카드 조회
const findAllMyCards = async (ownerId, keyword, genre, grade) => {
  // 필터링 : genre, grade, keyword
  // keyword 처리 후 genre, grade 처리
  // genre, grade enum 처리
  const genreValue = Object.values(Genre).includes(genre) ? genre : undefined;
  const gradeValue = Object.values(CardGrade).includes(grade)
    ? grade
    : undefined;

  // 기본 카드 조회
  const cards = await prisma.myCard.findMany({
    where: {
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

  return cards;
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
  createCard,
  findLimits,
};
