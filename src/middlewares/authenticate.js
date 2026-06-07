import { verifyAccessToken } from '../libs/jwt.js';
import { UnauthorizedError } from '../errors/appError.js';

export const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return next(new UnauthorizedError('토큰이 없습니다.'));
  }

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    next(new UnauthorizedError('유효하지 않은 토큰입니다.'));
  }
};
