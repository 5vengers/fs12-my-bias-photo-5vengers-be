import { marketService } from '../services/marketService.js';

export const marketController = {
  //전체 조회
  getMarketItems: asyncHandler(async (req, res, next) => {
    const result = await marketService.getMarketItems();
    return res.status(200).json({
      message: '판매 카드 전체 조회 성공',
      data: result,
    });
  }),

  //상세 조회
  getMarketItemDetail: asyncHandler(async (req, res, next) => {
    const { itemId } = req.params;
    const result = await marketService.getMarketItemDetail(Number(itemId));
    return res.status(200).json({
      message: '판매 카드 상세 조회 성공',
      data: result,
    });
  }),

  //  판매 등록
  createMarketItem: asyncHandler(async (req, res, next) => {
    const itemData = req.body;
    const result = await marketService.registerMarketItem(itemData);
    return res.status(201).json({
      message: '판매 카드 생성 성공',
      data: result,
    });
  }),

  // 정보 수정
  updateMarketItem: asyncHandler(async (req, res, next) => {
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
  }),

  // 판매 삭제
  deleteMarketItem: asyncHandler(async (req, res, next) => {
    const { itemId } = req.params;
    const result = await marketService.deleteMarketItem(Number(itemId));
    return res.status(200).json({
      message: '판매 카드 삭제 성공',
      data: result,
    });
  }),
};
