import authService from '../services/authService.js';
import { REFRESH_TOKEN_EXPIRES_MS } from '../constants/tokenConfig.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
};

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

/**
 * passport wiring은 authRouter에서 처리 완료 (req.oauthPayload 주입됨)
 * 이 함수는 토큰 발급과 응답 포맷팅만 담당
 */
const googleCallback = async (req, res, next) => {
  try {
    const { user, isNewUser } = req.oauthPayload;
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
          created_at: user.createdAt,
        },
        accessToken,
        is_new_user: isNewUser,
      },
    });
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
