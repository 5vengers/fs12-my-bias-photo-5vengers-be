import prisma from '../config/prisma.js';

const findByUserId = async (userId) => {
  return await prisma.userPoint.findUnique({
    where: { userId },
    select: {
      point: true,
    },
  });
};

export default { findByUserId };
