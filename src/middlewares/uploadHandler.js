import multer from 'multer';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

import { InvalidImageMimeType } from '../errors/appError.js';

const FILE_MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPE = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

const CLOUDINARY_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_SECRET = process.env.CLOUDINARY_API_SECRET;

cloudinary.config({
  cloud_name: CLOUDINARY_NAME,
  api_key: CLOUDINARY_KEY,
  api_secret: CLOUDINARY_SECRET,
});

// 파일 업로드 시 저장 경로
// upload는 single 로 받고 받은 경로는 req.file 로 표시
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'bias-photo/uploads',
    allowed_formats: ['jpg', 'png', 'gif', 'webp'],
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: FILE_MAX_SIZE },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPE.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new InvalidImageMimeType());
    }
  },
});
