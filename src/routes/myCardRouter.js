import express from 'express';
import { myCardController } from '../controllers/myCardController.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { authenticate } from '../middlewares/authenticate.js';

const router = express.Router();

// 나의 포토카드 전체 조회
router.get('/my-cards', authenticate, asyncHandler(myCardController.getMyCards));

// 나의 포토카드 단건 조회
router.get('/my-cards/:myCardId', authenticate, asyncHandler(myCardController.getMyCardById));

export default router;
