import { Router } from 'express';
import passport from './config/passport.js'; 
import authController from '../controllers/authController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { validate } from '../middlewares/validate.js';
import {
  loginSchema,
  registerSchema,
  googleCallbackSchema,
} from '../schemas/authSchema.js';
import { OAuthError } from '../errors/appError.js';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/logout', authenticate, authController.logout);
router.post('/refresh', authController.refresh);

// Google OAuth 인증 화면으로 리다이렉트
// googleLogin은 단순 passport 미들웨어이므로 controller 불필요
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  }),
);

// Google OAuth 콜백
// passport wiring(HTTP 레이어)은 라우터에서 처리하고,
// controller는 oauthPayload를 받아 토큰 발급·응답만 담당
router.get(
  '/google/callback',
  validate(googleCallbackSchema, 'query'),
  (req, res, next) => {
    // Google 측 에러 (사용자 취소 등) 조기 처리
    if (req.query.error) {
      const message =
        req.query.error === 'access_denied'
          ? '구글 로그인을 취소했습니다.'
          : `구글 로그인에 실패했습니다. (${req.query.error})`;
      return next(new OAuthError(message));
    }

    // custom callback 패턴: passport 결과를 req.oauthPayload로 전달
    passport.authenticate('google', { session: false }, (err, payload) => {
      if (err) return next(err);
      if (!payload) return next(new OAuthError('구글 로그인에 실패했습니다.'));
      req.oauthPayload = payload;
      next();
    })(req, res, next);
  },
  authController.googleCallback,
);

export default router;
