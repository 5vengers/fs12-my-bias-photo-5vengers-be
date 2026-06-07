import { ERROR_CODES } from '../constants/errorCodes.js';
import { AppError } from '../errors/appError.js';

// 요청 경로와 일치하는 라우터가 없을 때 실행
export const notFoundHandler = (req, res, next) => {
  // 공통 에러 미들웨어에서 처리할 404 에러 생성
  const error = new AppError(
    `요청한 경로를 찾을 수 없습니다: ${req.method} ${req.originalUrl}`,
    404,
    ERROR_CODES.NOT_FOUND,
  );

  // 생성한 에러를 다음 에러 처리 middleware로 전달
  next(error);
};
