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

/**
 * Google OAuth 인증 처리 중 발생하는 에러
 * - 이미 이메일/비밀번호로 가입된 계정과 이메일 충돌
 * - Google 인증 자체 실패 (사용자 취소, Google 서버 오류 등)
 * HTTP Status: 401 Unauthorized
 */
export class OAuthError extends AppError {
  constructor(message = 'Google 로그인에 실패했습니다.') {
    super(message, 401, ERROR_CODES.OAUTH_ERROR);
  }
}

/**
 * Google OAuth 이메일이 기존 LOCAL 계정과 충돌하는 경우 발생하는 에러
 * 인증 실패가 아닌 리소스 충돌이므로 409 사용
 * HTTP Status: 409 Conflict
 */
export class OAuthConflictError extends AppError {
  constructor(
    message = '해당 이메일로 이미 가입된 계정이 있습니다. 이메일로 로그인해주세요.',
  ) {
    super(message, 409, ERROR_CODES.OAUTH_CONFLICT);
  }
}

// MARK: 포인트 관련 에러 클래스 추가
export class PointsNotFoundError extends AppError {
  constructor() {
    super('포인트 정보를 찾을 수 없습니다.', 404, ERROR_CODES.POINTS_NOT_FOUND);
  }
}

// 포인트 박스 오픈 쿨다운 중 에러 클래스 추가
export class PointBoxCooldownError extends AppError {
  constructor() {
    super(
      '포인트 상자는 1시간에 한 번만 열 수 있습니다.',
      409,
      ERROR_CODES.POINT_BOX_COOLDOWN,
    );
  }
}

export class PhotoCardNotFoundError extends AppError {
  constructor() {
    super('해당 포토카드를 찾을 수 없습니다.', 404, ERROR_CODES.PHOTO_CARD_NOT_FOUND);
  }
}

// 포토 카드 생성 에러 클래스 추가
export class PhotoCardLimitError extends AppError {
  constructor() {
    super(
      '포토 카드는 월 3회 이하로 생성할 수 있습니다.',
      409,
      ERROR_CODES.PHOTO_CARD_ALREADY_LIMIT,
    );
  }
}

// 이미지 not found 에러 클래스 추가
export class InvalidImageFile extends AppError {
  constructor() {
    super(
      '포토 카드 생성에 필요한 이미지를 찾을 수 없습니다.',
      404,
      ERROR_CODES.INVALID_IMAGE_FILE,
    );
  }
}

// 이미지 파일 형식 불일치 에러 클래스 추가
export class InvalidImageMimeType extends AppError {
  constructor() {
    super(
      '이미지 파일 형식이 아닙니다.',
      409,
      ERROR_CODES.INVALID_IMAGE_MIME_TYPE,
    );
  }
}

// 이미지 파일 없음 에러 클래스 추가
export class CannotFoundImageUrl extends AppError {
  constructor() {
    super(
      '포토카드 이미지 URL 을 불러오지 못했습니다.',
      500,
      ERROR_CODES.CANNOT_FOUND_IMAGE_URL,
    );
  }
}
