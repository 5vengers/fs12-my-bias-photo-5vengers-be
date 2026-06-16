import express from 'express';

import { marketController } from '../controllers/marketController.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { validate } from '../middlewares/validate.js';
import { createMarketItemSchema } from '../schemas/marketSchema.js';
import { authenticate } from '../middlewares/authenticate.js';

const router = express.Router();
router.get('/test', (req, res) => {
  console.log('market test');
  res.json({ ok: true });
});
router.get('/items', asyncHandler(marketController.getMarketItems));
router.get(
  '/items/:itemId',
  authenticate,
  asyncHandler(marketController.getMarketItemDetail),
);
router.post(
  '/items',
  authenticate,
  validate(createMarketItemSchema),
  asyncHandler(marketController.createMarketItem),
);
router.patch(
  '/items/:itemId',
  authenticate,
  asyncHandler(marketController.updateMarketItem),
);
router.delete(
  '/items/:itemId',
  authenticate,
  asyncHandler(marketController.deleteMarketItem),
);

export default router;
