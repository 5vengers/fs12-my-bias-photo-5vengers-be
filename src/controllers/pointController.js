import pointService from '../services/pointService.js';

const getMyPoint = async (req, res) => {
  const { point } = await pointService.getMyPoint(req.user.userId);

  return res.json({
    success: true,
    data: point,
  });
};
const openPointBox = async (req, res) => {
  const result = await pointService.openPointBox(
    req.user.userId,
    req.body.boxNumber,
  );

  return res.json({
    success: true,
    data: result,
  });
};

export default { getMyPoint, openPointBox };
