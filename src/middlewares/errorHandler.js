import jwt from 'jsonwebtoken';

export const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: '토큰이 없습니다.' });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    next();
  } catch {
    res
      .status(401)
      .json({ success: false, message: '유효하지 않은 토큰입니다.' });
  }
};

export const errorHandler = (err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || '서버 오류가 발생했습니다.',
  });
};
