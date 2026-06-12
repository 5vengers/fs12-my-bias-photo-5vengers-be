import myGalleryRepository from '../repositories/myGalleryRepository.js';
import { InvalidImageFile } from '../errors/appError.js';
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

  const result = await myGalleryRepository.findAllMyCards(
    userId,
    keyword,
    genre,
    grade,
  );

  // 페이지네이션
  const totalCount = result.length;
  const totalPages = Math.ceil(totalCount / pageSizeNum);
  const skip = (pageNum - 1) * pageSizeNum;

  const paginationCards = result.slice(skip, skip + pageSizeNum);

  return paginationCards;
};

const registerCard = async (userId, file, cardData) => {
  if (!file) {
    throw new InvalidImageFile();
  }

  const imageUrl = `/uploads/${file.filename}`;

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
  registerCard,
  getCreationLog,
};
