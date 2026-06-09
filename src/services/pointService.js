import pointRepository from '../repositories/pointRepository.js';
import { PointsNotFoundError } from '../errors/appError.js';

const getMyPoint = async (userId) => {
  const userPoint = await pointRepository.findByUserId(userId);

  if (!userPoint) {
    throw new PointsNotFoundError();
  }

  return {
    point: userPoint.point,
  };
};

export default { getMyPoint };
