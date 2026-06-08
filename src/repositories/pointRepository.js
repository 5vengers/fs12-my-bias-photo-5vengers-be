import prisma from '../config/prisma.js';

const findByUserId = async (userId) => {
  prisma.userPoint.findUnique({
    where: { userId },
    select: {
      points: true,
    },
  });
};

export default { findByUserId };
