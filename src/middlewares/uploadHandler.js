import multer from 'multer';
import path from 'path';

import { InvalidImageMimeType } from '../errors/appError.js';

const FILE_MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPE = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

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
    const unique = Math.round(Math.random() * 1e9);
    const exName = path.extname(file.originalname);

    const fileName = `${nowDate}-${unique}-bias-photo${exName}`;

    cb(null, fileName);
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
