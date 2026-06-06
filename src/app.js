import express from 'express';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFoundHandler } from './middlewares/notFoundHandler.js';
import cors from 'cors';

const app = express();
// 라우터 등록 전에 공통 미들웨어 등록 (CORS, JSON 파싱 등)
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: '서버가 정상적으로 실행 중입니다.' });
});

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(3000, () => {
  console.log('서버가 3000번 포트에서 실행 중입니다.');
});
