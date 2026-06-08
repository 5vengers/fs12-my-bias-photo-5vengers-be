import express from 'express';

import { marketController } from '../controllers/marketController.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { validate } from '../middlewares/validate.js';
import { createMarketItemSchema } from '../schemas/marketSchema.js';

const router = express.Router();

router.get('/market/items', asyncHandler(marketController.getMarketItems));
router.get(
  '/market/items/:itemId',
  authenticate,
  asyncHandler(marketController.getMarketItemDetail),
);
router.post(
  '/market/items',
  validate(createMarketItemSchema),
  authenticate,
  asyncHandler(marketController.createMarketItem),
);
router.patch(
  '/market/items/:itemId',
  authenticate,
  asyncHandler(marketController.updateMarketItem),
);
router.delete(
  '/market/items/:itemId',
  authenticate,
  asyncHandler(marketController.deleteMarketItem),
);

export default router;
