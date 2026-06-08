import { ERROR_CODES } from '../constants/errorCodes.js';

// 서비스에서 의도적으로 발생시키는 예측 가능한 에러를 표현하는 custom error 클래스
export class AppError extends Error {
  // message: 에러 메시지, statusCode: HTTP 상태 코드, code: ERROR_CODES에서 정의한 에러 코드 문자열
  constructor(message, statusCode, code) {
    // 기존 Error 클래스에 에러 메시지 전달
    super(message);

    // 에러 클래스의 이름 설정
    this.name = 'AppError';

    // HTTP 응답에 사용할 상태 코드
    this.statusCode = statusCode;

    // FE에서 에러를 식별할 코드
    this.code = code;

    // 개발자가 예상하고 의도적으로 발생시킨 운영상 에러임을 표시
    this.isOperational = true;

    // 스택 트레이스에서 AppError 생성자 호출 부분을 제외
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 잘못된 입력값이 전달되었을 때 발생하는 에러
 * HTTP Status: 400 Bad Request
 */
export class ValidationError extends AppError {
  constructor(message = '입력값을 확인해주세요.') {
    super(message, 400, ERROR_CODES.VALIDATION_ERROR);
  }
}

/**
 * 인증 정보가 없거나 유효하지 않을 때 발생하는 에러
 * (토큰 없음, 토큰 만료, 로그인 실패 등)
 * HTTP Status: 401 Unauthorized
 */
export class UnauthorizedError extends AppError {
  constructor(message = '인증에 실패했습니다.') {
    super(message, 401, ERROR_CODES.UNAUTHORIZED);
  }
}

/**
 * JWT 토큰이 형식적으로 잘못되었거나
 * 위조된 토큰인 경우 발생하는 에러
 * HTTP Status: 401 Unauthorized
 */
export class InvalidTokenError extends AppError {
  constructor(message = '유효하지 않은 토큰입니다.') {
    super(message, 401, ERROR_CODES.INVALID_TOKEN);
  }
}

/**
 * JWT 토큰의 유효 기간이 만료된 경우 발생하는 에러
 * 사용자는 다시 로그인하여 새로운 토큰을 발급받아야 함
 * HTTP Status: 401 Unauthorized
 */
export class ExpiredTokenError extends AppError {
  constructor(message = '다시 로그인해주세요.') {
    super(message, 401, ERROR_CODES.EXPIRED_TOKEN);
  }
}

/**
 * 회원가입 시 이미 존재하는 이메일로 가입을 시도할 때 발생하는 에러
 * HTTP Status: 409 Conflict
 */
export class DuplicateEmailError extends AppError {
  constructor() {
    super('이미 가입된 이메일입니다.', 409, ERROR_CODES.DUPLICATE_EMAIL);
  }
}

/**
 * 회원가입 또는 프로필 수정 시
 * 이미 사용 중인 닉네임을 입력했을 때 발생하는 에러
 * HTTP Status: 409 Conflict
 */
export class DuplicateNicknameError extends AppError {
  constructor() {
    super('이미 사용 중인 닉네임입니다.', 409, ERROR_CODES.DUPLICATE_NICKNAME);
  }
}
