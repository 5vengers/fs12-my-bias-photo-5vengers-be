import { ERROR_CODES } from './errorHandler';

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const message = result.error.errors[0].message;
    return res.status(400).json({
      success: false,
      code: ERROR_CODES.VALIDATION_ERROR,
      message,
    });
  }

  req.body = result.data;
  next();
};
