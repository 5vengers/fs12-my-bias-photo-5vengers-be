import express from 'express';
import { marketController } from '../controllers/marketController.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';

const router = express.Router();

router.get('/market/items', asyncHandler(marketController.getMarketItems));
router.get(
  '/market/items/:itemId',
  asyncHandler(marketController.getMarketItemDetail),
);
router.post('/market/items', asyncHandler(marketController.createMarketItem));
router.patch(
  '/market/items/:itemId',
  asyncHandler(marketController.updateMarketItem),
);
router.delete(
  '/market/items/:itemId',
  asyncHandler(marketController.deleteMarketItem),
);

export default router;
