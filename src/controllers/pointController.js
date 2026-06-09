import pointService from '../services/pointService.js';

const getMyPoint = async (req, res, next) => {
  try {
    const userId = await pointService.getMyPoint(req.user.id);

    res.json({
      success: true,
      data: point,
    });
  } catch (err) {
    next(err);
  }
};

export default { getMyPoint };
