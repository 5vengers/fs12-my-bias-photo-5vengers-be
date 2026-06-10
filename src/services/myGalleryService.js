import myGalleryRepository from '../repositories/myGalleryRepository.js';
import { AppError } from '../errors/appError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 6;

const nowYearMonth = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  return {
    year,
    month,
  };
};

const getMyCards = async (userId, query) => {
  const {
    keyword = '',
    genre = '',
    grade = '',
    page = DEFAULT_PAGE,
    pageSize = DEFAULT_PAGE_SIZE,
  } = query;

  const pageNum = Number(page);
  const pageSizeNum = Number(pageSize);

  const result = await myGalleryRepository.findAllMyCards(userId);

  return result;
};

const resisterCard = async (userId, cardData) => {
  const result = await myGalleryRepository.createCard(
    userId,
    cardData,
    nowYearMonth(),
  );

  return result;
};

const getCreationLog = async (userId) => {
  // year, month
  const now = nowYearMonth();

  const result = await myGalleryRepository.findLimits(
    userId,
    now.year,
    now.month,
  );

  return result;
};

export default {
  getMyCards,
  resisterCard,
  getCreationLog,
};
