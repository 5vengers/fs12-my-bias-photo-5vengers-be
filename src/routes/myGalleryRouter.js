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
    cb(null, './uploads');
  },
  filename: (req, file, cb) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const second = now.getSeconds();
    const millis = now.getMilliseconds();

    const nowDate = `${year}-${month}-${day}-${hour}-${minute}-${second}-${millis}`;
    const exName = path.extname(file.originalname);

    const fileName = `${nowDate}-bias-photo${exName}`;

    cb(null, fileName);
  },
});

const upload = multer({ storage });

// 내 카드 조회
router.get('/', authenticate, asyncHandler(myGalleryController.getMyGallery));
router.post(
  '/create',
  authenticate,
  upload.single('imageUrl'),
  validate(createCardSchema),
  asyncHandler(myGalleryController.createPhotoCard),
);

// 카드 생성 횟수 조회
router.get(
  '/creation-log',
  authenticate,
  asyncHandler(myGalleryController.getLog),
);

export default router;
