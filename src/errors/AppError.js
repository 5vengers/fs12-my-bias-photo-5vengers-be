export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  DUPLICATE_EMAIL: 'DUPLICATE_EMAIL',
  DUPLICATE_NICKNAME: 'DUPLICATE_NICKNAME',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
};

export class AppError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export class ValidationError extends AppError {
  constructor(message = '입력값을 다시 확인해주세요.') {
    super(400, ERROR_CODES.VALIDATION_ERROR, message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = '인증에 실패했습니다.') {
    super(401, ERROR_CODES.UNAUTHORIZED, message);
  }
}

export class DuplicateEmailError extends AppError {
  constructor() {
    super(409, ERROR_CODES.DUPLICATE_EMAIL, '이미 가입된 이메일입니다.');
  }
}

export class DuplicateNicknameError extends AppError {
  constructor() {
    super(409, ERROR_CODES.DUPLICATE_NICKNAME, '이미 사용 중인 닉네임입니다.');
  }
}
