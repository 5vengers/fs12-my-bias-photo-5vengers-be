import { Router } from 'express';

import { asyncHandler } from '../middlewares/asyncHandler.js';
import { authenticate } from '../middlewares/authenticate.js';
import { validate } from '../middlewares/validate.js';
import { createCardSchema } from '../schemas/myGallerySchema.js';

import myGalleryController from '../controllers/myGalleryController.js';

const router = Router();

// 내 카드 조회
router.get('/', authenticate, asyncHandler(myGalleryController.getMyGallery));
router.post(
  '/create',
  authenticate,
  validate(createCardSchema),
  asyncHandler(myGalleryController.createPhotoCard),
);

// 카드 생성 횟수 조회
router.get(
  '/creationLog',
  authenticate,
  asyncHandler(myGalleryController.getLog),
);

export default router;
