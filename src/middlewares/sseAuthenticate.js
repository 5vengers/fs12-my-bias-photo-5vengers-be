import { verifyAccessToken } from '../libs/jwt.js';
import {
  UnauthorizedError,
  ExpiredTokenError,
  InvalidTokenError,
} from '../errors/appError.js';

/**
 * SSE 전용 인증 미들웨어
 *
 * Authorization 헤더 우선, 없으면 ?token 쿼리 파라미터를 사용합니다.
 * 브라우저 기본 EventSource는 커스텀 헤더를 지원하지 않으므로
 * 프론트엔드에서 ?token=<accessToken> 방식으로도 연결할 수 있습니다.
 */
export const sseAuthenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] ?? req.query.token;

  if (!token) {
    return next(new UnauthorizedError('토큰이 없습니다.'));
  }

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new ExpiredTokenError());
    }
    next(new InvalidTokenError('유효하지 않은 토큰입니다.'));
  }
};
