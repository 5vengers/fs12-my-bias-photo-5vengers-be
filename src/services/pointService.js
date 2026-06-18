import pointRepository from '../repositories/pointRepository.js';
import {
  PointsNotFoundError,
  PointBoxCooldownError,
} from '../errors/appError.js';

const BOX_COOLDOWN_MS = 60 * 60 * 1000;

const POINT_REWARDS = [
  50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800,
  850, 900, 950, 1000,
];

const createBoxRewards = () => {
  const shuffledRewards = [...POINT_REWARDS];

  for (let index = shuffledRewards.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));

    [shuffledRewards[index], shuffledRewards[randomIndex]] = [
      shuffledRewards[randomIndex],
      shuffledRewards[index],
    ];
  }

  return shuffledRewards.slice(0, 3);
};

const getMyPoint = async (userId) => {
  const userPoint = await pointRepository.findByUserId(userId);

  if (!userPoint) {
    throw new PointsNotFoundError();
  }

  return {
    point: userPoint.point,
  };
};

const openPointBox = async (userId, boxNumber) => {
  const userPoint = await pointRepository.findByUserId(userId);

  if (!userPoint) {
    throw new PointsNotFoundError();
  }

  const now = new Date();

  if (userPoint.lastSpinAt) {
    const nextAvailableAt = new Date(
      userPoint.lastSpinAt.getTime() + BOX_COOLDOWN_MS,
    );

    if (now < nextAvailableAt) {
      throw new PointBoxCooldownError();
    }
  }

  const boxRewards = createBoxRewards();
  const earnedPoint = boxRewards[boxNumber - 1];
  const availableBefore = new Date(now.getTime() - BOX_COOLDOWN_MS);

  const updatedPoint = await pointRepository.awardBoxPoint({
    userId,
    amount: earnedPoint,
    now,
    availableBefore,
  });

  if (!updatedPoint) {
    throw new PointBoxCooldownError();
  }

  return {
    boxNumber,
    earnedPoint,
    currentPoint: updatedPoint.point,
    nextAvailableAt: new Date(now.getTime() + BOX_COOLDOWN_MS),
  };
};

export default {
  getMyPoint,
  openPointBox,
};
