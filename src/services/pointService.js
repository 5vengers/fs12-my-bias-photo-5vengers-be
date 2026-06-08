import pointRepository from '../repositories/pointRepository.js';
import { PointNotFoundError } from '../errors/appError.js';

const getMyPoint = async (userId) => {
  const userPoint = await pointRepository.findByUserId(userId);

  if (!userPoint) {
    throw new PointNotFoundError();
  }

  return {
    point: userPoint.point,
  };
};

export default { getMyPoint };
