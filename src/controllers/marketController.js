import { marketService } from '../services/marketService.js';

export const marketController = {
  //전체 조회
  getMarketItems: async (req, res) => {
    const { page = 1, limit = 6 } = req.query;

    const result = await marketService.getMarketItems(
      Number(page),
      Number(limit),
    );
    return res.status(200).json({
      success: true,
      message: '판매 카드 전체 조회 성공',
      data: result,
    });
  },

  //상세 조회
  getMarketItemDetail: async (req, res) => {
    const { itemId } = req.params;
    const result = await marketService.getMarketItemDetail(Number(itemId));
    return res.status(200).json({
      success: true,
      message: '판매 카드 상세 조회 성공',
      data: result,
    });
  },

  //  판매 등록
  createMarketItem: async (req, res) => {
    const userId = req.user.userId;
    const itemData = req.body;
    const result = await marketService.registerMarketItem(userId, itemData);
    return res.status(201).json({
      success: true,
      message: '판매 카드 생성 성공',
      data: result,
    });
  },

  // 정보 수정
  updateMarketItem: async (req, res) => {
    const { itemId } = req.params;
    const userId = req.user.userId;
    const itemData = req.body;

    const result = await marketService.updateMarketItem(
      userId,
      Number(itemId),
      itemData,
    );
    return res.status(200).json({
      success: true,
      message: '판매 카드 수정 성공',
      data: result,
    });
  },

  // 판매 삭제
  deleteMarketItem: async (req, res) => {
    const { itemId } = req.params;
    const userId = req.user.userId;

    const result = await marketService.deleteMarketItem(userId, Number(itemId));
    return res.status(200).json({
      success: true,
      message: '판매 카드 삭제 성공',
      data: result,
    });
  },

  getMyCardMaxQuantity: async (req, res, next) => {
    const userId = req.user.id;
    const { myCardId } = req.params;

    const maxQuantity = await marketService.getMyCardMaxQuantity(
      userId,
      Number(myCardId),
    );

    return res.status(200).json({
      success: true,
      message: '최대 판매 가능 수 조회 성공',
      data: result,
    });
  },
};
