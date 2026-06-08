import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import authService from '../services/authService.js';

/**
 * Google OAuth 2.0 Strategy 등록
 *
 * verify callback: Google 인증 성공 후 호출되며
 * done(null, payload) 호출 시 payload가 req.user에 주입된다.
 *
 */
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(
            new Error('Google 계정에서 이메일 정보를 가져올 수 없습니다.'),
          );
        }

        const { user, isNewUser } = await authService.findOrCreateGoogleUser({
          email,
          nickname: profile.displayName,
          providerId: profile.id,
        });

        // done의 두 번째 인자가 req.user로 주입됨
        done(null, { user, isNewUser });
      } catch (err) {
        done(err);
      }
    },
  ),
);

export default passport;
