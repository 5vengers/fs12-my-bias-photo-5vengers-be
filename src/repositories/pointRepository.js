import prisma from '../config/prisma.js';

const findByUserId = async (userId) => {
  return await prisma.userPoint.findUnique({
    where: { userId },
    select: {
      point: true,
      lastSpinAt: true,
    },
  });
};

// MARK: 지급 트랜잭션 추가
const awardBoxPoint = async ({ userId, amount, now, availableBefore }) =>
  prisma.$transaction(async (tx) => {
    const updated = await tx.userPoint.updateMany({
      where: {
        userId,
        OR: [{ lastSpinAt: null }, { lastSpinAt: { lte: availableBefore } }],
      },
      data: {
        point: { increment: amount },
        lastSpinAt: now,
      },
    });

    if (updated.count === 0) {
      return null;
    }

    await tx.pointLog.create({
      data: {
        userId,
        type: 'BOX',
        amount,
      },
    });

    return tx.userPoint.findUnique({
      where: { userId },
      select: {
        point: true,
        lastSpinAt: true,
      },
    });
  });

export default {
  findByUserId,
  awardBoxPoint,
};
