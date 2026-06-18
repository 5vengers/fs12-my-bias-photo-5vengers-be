import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from './config/passport.js';
import authRouter from './routes/authRouter.js';
import marketRouter from './routes/marketRouter.js';
import myCardRouter from './routes/myCardRouter.js';
import pointRouter from './routes/pointRouter.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFoundHandler } from './middlewares/notFoundHandler.js';

const app = express();

// 공통 미들웨어
app.use(cors({ credentials: true, origin: true }));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.get('/', (req, res) => {
  res.json({ message: '서버가 정상적으로 실행 중입니다.' });
});

// 라우터 등록
app.use('/api/auth', authRouter);
app.use('/api', marketRouter);
app.use('/api', myCardRouter);
app.use('/api', pointRouter);

// 에러 핸들러
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`서버가 ${PORT}번 포트에서 실행 중입니다.`));
