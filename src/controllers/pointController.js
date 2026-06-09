import pointService from '../services/pointService.js';

const getMyPoint = async (req, res, next) => {
  try {
    const { point } = await pointService.getMyPoint(req.user.userId);

    res.json({
      success: true,
      data: point,
    });
  } catch (err) {
    next(err);
  }
};

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
