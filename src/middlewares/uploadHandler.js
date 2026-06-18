import multer from 'multer';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
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

// 파일 업로드 시 buffer 로만 인수
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: FILE_MAX_SIZE },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPE.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new InvalidImageMimeType());
    }
  },
});

// 버퍼를 cloudinary 로 업로드
export const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadCloud = cloudinary.uploader.upload_stream(
      {
        folder: 'bias-photo/uploads',
        allowed_formats: ['jpg', 'png', 'gif', 'webp'],
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      },
    );

    uploadCloud.end(fileBuffer);
  });
};
