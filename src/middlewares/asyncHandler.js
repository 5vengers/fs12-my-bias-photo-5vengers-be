export const asyncHandler = (handler) => async (req, res, next) => {
  try {
    return await handler(req, res, next);
  } catch (err) {
    next(err);
  }
};
