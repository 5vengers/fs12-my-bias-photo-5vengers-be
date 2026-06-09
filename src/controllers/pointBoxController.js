import pointService from '../services/pointService.js';

const openPointBox = async (req, res, next) => {
  try {
    const result = await pointService.openPointBox(
      req.user.userId,
      req.body.boxNumber,
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export default { getMyPoint, openPointBox };
