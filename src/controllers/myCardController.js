import { myCardService } from '../services/myCardService.js';

export const myCardController = {
  // GET /api/my-cards
  getMyCards: async (req, res) => {
    const userId = req.user.id;
    const result = await myCardService.getMyCards(userId);
    return res.status(200).json({
      success: true,
      message: '나의 포토카드 조회 성공',
      data: result,
    });
  },

  // GET /api/my-cards/:myCardId
  getMyCardById: async (req, res) => {
    const userId = req.user.id;
    const { myCardId } = req.params;
    const result = await myCardService.getMyCardById(Number(myCardId), userId);
    return res.status(200).json({
      success: true,
      message: '나의 포토카드 단건 조회 성공',
      data: result,
    });
  },
};
