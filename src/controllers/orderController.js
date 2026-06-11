import { orderService } from '../services/orderService.js';

const purchase = async (req, res) => {
  const result = await orderService.purchase({
    buyerId: req.user.userId,
    marketItemId: Number(req.params.itemId),
    quantity: req.body.quantity,
  });

  return res.status(201).json({
    success: true,
    message: '포토카드 구매에 성공했습니다.',
    data: result,
  });
};

export const orderController = { purchase };
