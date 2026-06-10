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

// MARK: 지급 트랜잭션 추가(보유 포인트 증가 / `lastSpinAt` 갱신 / 포인트로그 생성)
const awardBoxPoint = async ({ userId, amount, now, availableBefore }) => {
  return prisma.$transaction(async (tx) => {
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

    const userPoint = await tx.userPoint.findUnique({
      where: { userId },
      select: {
        point: true,
        lastSpinAt: true,
      },
    });

    await tx.pointLog.create({
      data: {
        userId,
        type: 'BOX',
        amount,
        balanceAfter: userPoint.point,
        referenceType: 'POINT_BOX',
        description: '랜덤 포인트 상자 보상',
      },
    });

    return userPoint;
  });
};

export default {
  findByUserId,
  awardBoxPoint,
};
