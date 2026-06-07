import { marketService } from '../services/marketService';

export const marketController = {
  //전체 조회
  getMarketItems: async (req, res, next) => {
    try {
      const result = await marketService.getMarketItems();
      return res.status(200).json({
        message: '판매 카드 전체 조회 성공',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  //상세 조회
  getMarketItemDetail: async (req, res, next) => {
    try {
      const { itemId } = req.params;
      const result = await marketService.getMarketItemDetail(Number(itemId));
      return res.status(200).json({
        message: '판매 카드 상세 조회 성공',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // 3. 판매 등록
  createMarketItem: async (req, res, next) => {
    try {
      const itemData = req.body;
      const result = await marketService.registerMarketItem(itemData);
      return res.status(201).json({
        message: '판매 카드 생성 성공',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // 4. 정보 수정
  updateMarketItem: async (req, res, next) => {
    try {
      const { itemId } = req.params;
      const itemData = req.body;
      const result = await marketService.updateMarketItem(
        Number(itemId),
        itemData,
      );
      return res.status(200).json({
        message: '판매 카드 수정 성공',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // 5. 판매 삭제
  deleteMarketItem: async (req, res, next) => {
    try {
      const { itemId } = req.params;
      const result = await marketService.deleteMarketItem(Number(itemId));
      return res.status(200).json({
        message: '판매 카드 삭제 성공',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
};
