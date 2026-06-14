import passport from '../config/passport.js';
import { OAuthConflictError, OAuthError } from '../errors/appError.js';

/**
 * Google OAuth 콜백 미들웨어
 *
 * 역할: passport wiring + Google 에러 처리
 * 완료 후 req.oauthPayload = { user, isNewUser } 주입
 * 다음 미들웨어(authController.googleCallback)는 응답만 담당
 */

const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:3001';

export const googleCallbackHandler = (req, res, next) => {
  // Google 측 에러 조기 처리 (사용자 취소 등)
  if (req.query.error) {
    return res.redirect(`${FRONTEND_URL}/auth/callback?error=OAUTH_ERROR`);
  }

  passport.authenticate('google', { session: false }, (err, payload) => {
    if (err) {
      // OAuthConflictError는 JSON 응답이 아닌 FE 리다이렉트로 처리
      // errorHandler로 넘기면 브라우저 리다이렉트 흐름에서 JSON이 그대로 노출됨
      if (err instanceof OAuthConflictError) {
        return res.redirect(
          `${FRONTEND_URL}/auth/callback?error=OAUTH_CONFLICT`,
        );
      }
      return next(err);
    }
    if (!payload) return next(new OAuthError('구글 로그인에 실패했습니다.'));

    req.oauthPayload = payload;
    next();
  })(req, res, next);
};
