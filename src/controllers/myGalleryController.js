import myGalleryService from '../services/myGalleryService.js';

const getMyGallery = async (req, res, next) => {
  const { userId } = req.user;

  const query = req.query;

  const result = await myGalleryService.getMyCards(userId, query);

  return res.status(200).json({
    success: true,
    message: '마이 갤러리 조회 성공',
    data: result,
  });
};

const getMyGalleryCount = async (req, res, next) => {
  const { userId } = req.user;

  const result = await myGalleryService.getCardCount(userId);

  return res.status(200).json({
    success: true,
    message: '마이 갤러리 카드 개수 조회 성공',
    data: result,
  });
};

const createPhotoCard = async (req, res, next) => {
  const { userId } = req.user;
  const cardData = req.body;
  const file = req.file;

  const result = await myGalleryService.registerCard(userId, file, cardData);

  return res.status(201).json({
    success: true,
    message: '포토 카드 생성 성공',
    data: result,
  });
};

// 생성 로그 조회
const getLog = async (req, res, next) => {
  const { userId } = req.user;
  const result = await myGalleryService.getCreationLog(userId);

  return res.status(200).json({
    success: true,
    message: '생성 로그 조회 성공',
    data: result,
  });
};

export default {
  getMyGallery,
  getMyGalleryCount,
  createPhotoCard,
  getLog,
};
