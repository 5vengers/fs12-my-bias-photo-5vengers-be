import { Router } from 'express';

import { asyncHandler } from '../middlewares/asyncHandler.js';
import { authenticate } from '../middlewares/authenticate.js';
import { validate } from '../middlewares/validate.js';
import { upload } from '../middlewares/uploadHandler.js';

import {
  createCardSchema,
  getMyCardQuerySchema,
} from '../schemas/myCardSchema.js';
import myCardController from '../controllers/myCardController.js';

const router = Router();

// 나의 판매 포토카드 조회

// 마이갤러리 조회
router.get(
  '/gallery',
  authenticate,
  validate(getMyCardQuerySchema, 'query'),
  asyncHandler(myCardController.getMyGalleryCards),
);

//
router.get(
  '/gallery/card-count',
  authenticate,
  asyncHandler(myCardController.getMyGalleryCount),
);

// 나의 판매 포토카드 조회
router.get(
  '/sales',
  authenticate,
  validate(getMyCardQuerySchema, 'query'),
  asyncHandler(myCardController.getMySalesCards),
);

router.get(
  '/sales/card-count',
  authenticate,
  asyncHandler(myCardController.getMySalesCount),
);

// 포토카드 생성
router.post(
  '/create',
  authenticate,
  upload.single('imageUrl'),
  validate(createCardSchema),
  asyncHandler(myCardController.createPhotoCard),
);

// 카드 생성 횟수 조회
router.get(
  '/creation-log',
  authenticate,
  asyncHandler(myCardController.getLog),
);

export default router;
