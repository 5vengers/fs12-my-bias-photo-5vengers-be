import { Router } from 'express';
import multer from 'multer';

import { asyncHandler } from '../middlewares/asyncHandler.js';
import { authenticate } from '../middlewares/authenticate.js';
import { validate } from '../middlewares/validate.js';
import { createCardSchema } from '../schemas/myGallerySchema.js';

import myGalleryController from '../controllers/myGalleryController.js';
import path from 'path';

const router = Router();

// 파일 업로드 시 저장 경로
// upload는 single 로 받고 받은 경로는 req.file 로 표시
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './cardUploads');
  },
  filename: (req, file, cb) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDay();

    const nowDate = `${year}-${month}-${day}`;
    const detail = `-bias-photo-${path.extname(file.originalname)}`;
    const fileName = `${nowDate}${detail}`;

    cb(null, fileName);
  },
});

const upload = multer({ storage });

// 내 카드 조회
router.get('/', asyncHandler(myGalleryController.getMyGallery));
router.post(
  '/create',
  validate(createCardSchema),
  upload.single('image'),
  asyncHandler(myGalleryController.createPhotoCard),
);

// 카드 생성 횟수 조회
router.get('/creationLog', asyncHandler(myGalleryController.getLog));

export default router;
