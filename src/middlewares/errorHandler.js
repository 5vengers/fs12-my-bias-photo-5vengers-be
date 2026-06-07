// APP에서 발생한 에러를 공통 API 응답 형식으로 반환하는 전역 에러 처리 미들웨어
import { ERROR_CODES } from '../constants/errorCodes.js';

// Express 에러 처리 미들웨어는 반드시 네 개의 매개변수 (error, req, res, next)를 가져야 함
export const errorHandler = (error, req, res, next) => {
  // AppError에 지정된 HTTP 상태 코드가 없으면 500 사용
  const statusCode = error.statusCode ?? 500;

  // AppError에 지정된 에러 코드가 없으면 서버 내부 오류 코드 사용
  const code = error.code ?? ERROR_CODES.INTERNAL_ERROR;

  // 의도적으로 발생시킨 에러가 아니면 서버 내부에 원본 에러 기록
  if (!error.isOperational) {
    console.error(error);
  }

  // 예상 가능한 에러는 작성된 메시지를 사용하고 예상하지 못한 에러는 고정 메시지 사용
  const message = error.isOperational
    ? error.message
    : '서버 내부 오류가 발생했습니다.';

  // 공통 실패 응답 형식 반환
  return res.status(statusCode).json({
    success: false,
    code,
    message,
  });
};
