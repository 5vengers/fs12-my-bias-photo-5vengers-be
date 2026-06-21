import myCardRepository from '../repositories/myCardRepository.js';
import { CannotFoundImageUrl, InvalidImageFile } from '../errors/appError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';
import { uploadToCloudinary } from '../middlewares/uploadHandler.js';

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

const getMyGallery = async (userId, query) => {
  const { keyword = '', genre = '', grade = '', page = DEFAULT_PAGE } = query;

  const pageNum = Number(page);

  const limit = DEFAULT_PAGE_SIZE;
  const skip = (pageNum - 1) * limit;

  const result = await myCardRepository.findGalleryCards(
    userId,
    keyword,
    genre,
    grade,
    skip,
    limit,
  );

  return result;
};

const getGalleryCount = async (userId) => {
  const result = await myCardRepository.findGalleryCount(userId);

  return result;
};

const getMySales = async (userId, query) => {
  const {
    keyword = '',
    genre = '',
    grade = '',
    saleType = '',
    status = '',
    page = DEFAULT_PAGE,
  } = query;

  const pageNum = Number(page);

  const isSoldOut =
    status === 'SOLD_OUT' ? true : status === 'SELLING' ? false : undefined;

  const limit = DEFAULT_PAGE_SIZE;
  const skip = (pageNum - 1) * limit;

  const result = await myCardRepository.findSalesCards(
    userId,
    keyword,
    genre,
    grade,
    saleType,
    isSoldOut,
    skip,
    limit,
  );

  return result;
};

const getSalesCount = async (userId) => {
  const result = await myCardRepository.findSalesCount(userId);

  return result;
};

const registerCard = async (userId, file, cardData) => {
  if (!file) {
    throw new InvalidImageFile();
  }

  const imagePath = file.buffer;

  let imageUrl = '';

  try {
    const image = await uploadToCloudinary(imagePath);

    imageUrl = image.secure_url;
  } catch (error) {
    throw new CannotFoundImageUrl();
  }

  const result = await myCardRepository.createCard(
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

  const result = await myCardRepository.findLimits(userId, now.year, now.month);

  return result;
};

export default {
  getMyGallery,
  getGalleryCount,
  getMySales,
  getSalesCount,
  registerCard,
  getCreationLog,
};
