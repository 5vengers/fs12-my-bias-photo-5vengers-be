import myGalleryRepository from '../repositories/myGalleryRepository.js';
import { InvalidImageFile } from '../errors/appError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 12;

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
  const { keyword = '', genre = '', grade = '', page = DEFAULT_PAGE } = query;

  const pageNum = Number(page);

  const limit = DEFAULT_PAGE_SIZE;
  const skip = (pageNum - 1) * limit;

  const result = await myGalleryRepository.findAllMyCards(
    userId,
    keyword,
    genre,
    grade,
    skip,
    limit,
  );

  return result;
};

const getCardCount = async (userId) => {
  const result = await myGalleryRepository.findAllCardCount(userId);

  return result;
};

const registerCard = async (userId, file, cardData) => {
  if (!file) {
    throw new InvalidImageFile();
  }

  const imageUrl = file.path;

  const result = await myGalleryRepository.createCard(
    userId,
    imageUrl,
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
  getCardCount,
  registerCard,
  getCreationLog,
};
