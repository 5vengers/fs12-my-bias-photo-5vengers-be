import passport from '../config/passport.js';
import { OAuthError } from '../errors/appError.js';

/**
 * Google OAuth 콜백 미들웨어
 *
 * 역할: passport wiring + Google 에러 처리
 * 완료 후 req.oauthPayload = { user, isNewUser } 주입
 * 다음 미들웨어(authController.googleCallback)는 응답만 담당
 */
export const googleCallbackHandler = (req, res, next) => {
  // Google 측 에러 조기 처리 (사용자 취소 등)
  if (req.query.error) {
    const message =
      req.query.error === 'access_denied'
        ? '구글 로그인을 취소했습니다.'
        : `구글 로그인에 실패했습니다. (${req.query.error})`;
    return next(new OAuthError(message));
  }

  passport.authenticate('google', { session: false }, (err, payload) => {
    if (err) return next(err);
    if (!payload) return next(new OAuthError('구글 로그인에 실패했습니다.'));

    req.oauthPayload = payload;
    next();
  })(req, res, next);
};
