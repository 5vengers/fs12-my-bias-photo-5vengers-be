import passport from '../config/passport.js';
import authService from '../services/authService.js';
import { OAuthError } from '../errors/appError.js';
import { REFRESH_TOKEN_EXPIRES_MS } from '../constants/tokenConfig.js';

const setRefreshTokenCookie = (res, refreshToken) => {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: REFRESH_TOKEN_EXPIRES_MS,
  });
};

const register = async (req, res, next) => {
  try {
    const user = await authService.register(req.body);
    res.status(201).json({
      success: true,
      message: '회원가입이 완료되었습니다.',
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { user, accessToken, refreshToken } = await authService.login(
      req.body,
    );

    setRefreshTokenCookie(res, refreshToken);

    res.json({
      success: true,
      message: '로그인이 완료되었습니다.',
      data: { user, accessToken },
    });
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;
    if (refreshToken) {
      await authService.logout(refreshToken);
    }
    res.clearCookie('refreshToken');
    res.json({ success: true, message: '로그아웃되었습니다.' });
  } catch (err) {
    next(err);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;
    const { accessToken, refreshToken: newRefreshToken } =
      await authService.refresh(refreshToken);

    setRefreshTokenCookie(res, newRefreshToken);

    res.json({
      success: true,
      message: '토큰이 재발급되었습니다.',
      data: { accessToken },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// Google OAuth
// ─────────────────────────────────────────────

/**
 * GET /api/auth/google
 * Google OAuth 인증 화면으로 리다이렉트
 */
const googleLogin = passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false,
});

/**
 * GET /api/auth/google/callback
 * Google 인증 후 콜백 처리
 *
 * 실행 순서:
 * 1. validate(googleCallbackSchema, 'query') → 쿼리 파라미터 구조 검증 (app.js에서 주입)
 * 2. req.query.error 존재 여부 확인 → 사용자 취소 등 Google 측 에러 조기 처리
 * 3. passport.authenticate (custom callback) → Google 프로필 수신 + 유저 조회/생성
 * 4. authService.oauthLogin → JWT 발급 (기존 이메일 로그인과 동일한 흐름)
 */
const googleCallback = (req, res, next) => {
  // Google이 error 쿼리 파라미터를 전달한 경우 조기 처리
  const { error: oauthError } = req.query;
  if (oauthError) {
    const message =
      oauthError === 'access_denied'
        ? '구글 로그인을 취소했습니다.'
        : `구글 로그인에 실패했습니다. (${oauthError})`;
    return next(new OAuthError(message));
  }

  // Custom callback 패턴:
  // failureRedirect 대신 JSON 에러 응답을 위해 세 번째 인자로 직접 제어
  passport.authenticate('google', { session: false }, async (err, payload) => {
    try {
      if (err) return next(err);

      if (!payload) {
        return next(new OAuthError('구글 로그인에 실패했습니다.'));
      }

      const { user, isNewUser } = payload;

      // JWT 발급 - 기존 이메일 로그인(authService.login)과 동일한 흐름
      const { accessToken, refreshToken } = await authService.oauthLogin(user);

      setRefreshTokenCookie(res, refreshToken);

      res.json({
        success: true,
        message: '구글 로그인에 성공했습니다.',
        data: {
          user: {
            id: user.id,
            email: user.email,
            nickname: user.nickname,
            provider: user.provider,
          },
          accessToken,
          is_new_user: isNewUser,
        },
      });
    } catch (innerErr) {
      next(innerErr);
    }
  })(req, res, next);
};

export default {
  register,
  login,
  logout,
  refresh,
  googleLogin,
  googleCallback,
};
