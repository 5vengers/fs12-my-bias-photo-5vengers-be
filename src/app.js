import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from './config/passport.js';
import authController from './controllers/authController.js';
import { authenticate } from './middlewares/authenticate.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFoundHandler } from './middlewares/notFoundHandler.js';
import { validate } from './middlewares/validate.js';
import {
  loginSchema,
  registerSchema,
  googleCallbackSchema,
} from './schemas/authSchema.js';

const app = express();

// 라우터 등록 전에 공통 미들웨어 등록 (CORS, JSON 파싱 등)
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Passport 초기화
app.use(passport.initialize());

app.get('/', (req, res) => {
  res.json({ message: '서버가 정상적으로 실행 중입니다.' });
});

app.post(
  '/api/auth/register',
  validate(registerSchema),
  authController.register,
);
app.post('/api/auth/login', validate(loginSchema), authController.login);
app.post('/api/auth/logout', authenticate, authController.logout);
app.post('/api/auth/refresh', authController.refresh);

app.get('/api/auth/google', authController.googleLogin);
app.get(
  '/api/auth/google/callback',
  validate(googleCallbackSchema, 'query'),
  authController.googleCallback,
);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`서버가 ${PORT}번 포트에서 실행 중입니다.`));
