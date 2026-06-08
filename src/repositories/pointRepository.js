import prisma from '../prisma';

const findByUserId = async (userId) => {
  prisma.userPoint.findUnique({
    where: { userId },
    select: {
      points: true,
    },
  });
};

export default { findByUserId };
