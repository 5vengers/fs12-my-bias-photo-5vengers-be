import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from './config/passport.js';
import authRouter from './routes/authRouter.js';
import pointRouter from './routes/pointRouter.js';
import marketRouter from './routes/marketRouter.js';
import myGalleryRouter from './routes/myGalleryRouter.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFoundHandler } from './middlewares/notFoundHandler.js';
import orderRouter from './routes/orderRouter.js';
import exchangeRouter from './routes/exchangeRouter.js';

const app = express();

// 라우터 등록 전에 공통 미들웨어 등록 (CORS, JSON 파싱 등)
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:3001';

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.get('/', (req, res) => {
  res.json({ message: '서버가 정상적으로 실행 중입니다.' });
});

app.use('/uploads', express.static('uploads'));

app.use('/api/auth', authRouter);
app.use('/api/points', pointRouter);
app.use('/api', marketRouter);
app.use('/api/mygallery', myGalleryRouter);
app.use('/api', orderRouter);
app.use('/api', exchangeRouter);

// 라우터 등록 후, 404 Not Found 처리 미들웨어와 에러 처리 미들웨어 등록
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`서버가 ${PORT}번 포트에서 실행 중입니다.`));
