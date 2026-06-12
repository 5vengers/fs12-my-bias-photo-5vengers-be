import authService from '../services/authService.js';
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
    if (refreshToken) await authService.logout(refreshToken);
    res.clearCookie('refreshToken', COOKIE_OPTIONS);
    res.json({ success: true, message: '로그아웃되었습니다.' });
  } catch (err) {
    next(err);
  }
};

const refresh = async (req, res, next) => {
  try {
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
  } catch (err) {
    next(err);
  }
};

const googleCallback = async (req, res, next) => {
  try {
    const { user } = req.oauthPayload;

    const { refreshToken } = await authService.oauthLogin(user);

    setRefreshTokenCookie(res, refreshToken);
    return res.redirect(`${FRONTEND_URL}/auth/callback`);
  } catch (err) {
    next(err);
  }
};

export default {
  register,
  login,
  logout,
  refresh,
  googleCallback,
};
