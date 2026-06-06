import jwt from 'jsonwebtoken';

// ─── 에러 코드 ───────────────────────────────────────
export const ERROR_CODES = {
  //400
  VALIDATION_ERROR: 'VALIDATION_ERROR',

  //401
  UNAUTHORIZED: 'UNAUTHORIZED',

  //409
  DUPLICATE_EMAIL: 'DUPLICATE_EMAIL',
  DUPLICATE_NICKNAME: 'DUPLICATE_NICKNAME',

  //500
  INTERNAL_ERROR: 'INTERNAL_ERROR',
};

// ─── 에러 클래스 ──────────────────────────────────────
export class AppError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
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

export class UnauthorizedError extends AppError {
  constructor(message = '인증에 실패했습니다.') {
    super(401, ERROR_CODES.UNAUTHORIZED, message);
  }
}

// ─── 미들웨어 ─────────────────────────────────────────
export const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return next(new UnauthorizedError('토큰이 없습니다.'));
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    next();
  } catch {
    next(new UnauthorizedError('유효하지 않은 토큰입니다.'));
  }
};

export const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err instanceof AppError) {
    return res.status(err.status).json({
      success: false,
      code: err.code,
      message: err.message,
    });
  }

  res.status(500).json({
    success: false,
    code: ERROR_CODES.INTERNAL_ERROR,
    message: '서버 내부 오류가 발생했습니다.',
  });
};
