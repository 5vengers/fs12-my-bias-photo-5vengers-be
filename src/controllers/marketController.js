import { marketService } from '../services/marketService.js';

export const marketController = {
  //전체 조회
  getMarketItems: async (req, res) => {
    const result = await marketService.getMarketItems();
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
};
