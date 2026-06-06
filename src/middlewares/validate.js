import { ValidationError } from './errorHandler.js';

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const message = result.error.errors[0].message;
    return next(new ValidationError(message));
  }

  req.body = result.data;
  next();
};
