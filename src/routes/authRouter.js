import { Router } from 'express';
import passport from '../config/passport.js';
import authController from '../controllers/authController.js';
import { googleCallbackHandler } from '../middlewares/oauthHandler.js';
import { validate } from '../middlewares/validate.js';
import {
  loginSchema,
  registerSchema,
  googleCallbackSchema,
} from '../schemas/authSchema.js';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refresh);

// Google OAuth
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
    state: true,
  }),
);

router.get(
  '/google/callback',
  validate(googleCallbackSchema, 'query'),
  googleCallbackHandler,
  authController.googleCallback,
);

export default router;
