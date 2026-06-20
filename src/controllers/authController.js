import authService from '../services/authService.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { REFRESH_TOKEN_EXPIRES_MS } from '../constants/tokenConfig.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
};

const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:3001';

const setRefreshTokenCookie = (res, refreshToken) => {
  res.cookie('refreshToken', refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: REFRESH_TOKEN_EXPIRES_MS,
  });
};

const register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.validated.body);
  res.status(201).json({
    success: true,
    message: '회원가입이 완료되었습니다.',
    data: user,
  });
});

const login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.login(
    req.validated.body,
  );
  setRefreshTokenCookie(res, refreshToken);
  res.json({
    success: true,
    message: '로그인이 완료되었습니다.',
    data: { user, accessToken },
  });
});

const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.cookies;
  if (refreshToken) await authService.logout(refreshToken);
  res.clearCookie('refreshToken', COOKIE_OPTIONS);
  res.json({ success: true, message: '로그아웃되었습니다.' });
});

const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.cookies;
  const {
    user,
    accessToken,
    refreshToken: newRefreshToken,
  } = await authService.refresh(refreshToken);
  setRefreshTokenCookie(res, newRefreshToken);
  res.json({
    success: true,
    message: '토큰이 재발급되었습니다.',
    data: { user, accessToken },
  });
});

const googleCallback = asyncHandler(async (req, res) => {
  const { user } = req.oauthPayload;
  const { refreshToken } = await authService.oauthLogin(user);
  setRefreshTokenCookie(res, refreshToken);
  res.redirect(
    `${FRONTEND_URL}/auth/callback${isNewUser ? '?isNewUser=true' : ''}`,
  );
});

export default {
  register,
  login,
  logout,
  refresh,
  googleCallback,
};
