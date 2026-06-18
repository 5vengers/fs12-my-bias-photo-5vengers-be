import express from 'express';

import { marketController } from '../controllers/marketController.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { validate } from '../middlewares/validate.js';
import {
  createMarketItemSchema,
  itemIdParamsSchema,
  myCardIdParamsSchema,
} from '../schemas/marketSchema.js';
import { authenticate } from '../middlewares/authenticate.js';

const router = express.Router();

router.get('/items', asyncHandler(marketController.getMarketItems));
router.get(
  '/items/:itemId',
  authenticate,
  validate(itemIdParamsSchema, 'params'),
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
  validate(itemIdParamsSchema, 'params'),
  asyncHandler(marketController.updateMarketItem),
);
router.delete(
  '/items/:itemId',
  authenticate,
  validate(itemIdParamsSchema, 'params'),
  asyncHandler(marketController.deleteMarketItem),
);
router.get(
  '/items/:myCardId/max',
  authenticate,
  validate(myCardIdParamsSchema, 'params'),
  asyncHandler(marketController.getMyCardMaxQuantity),
);

export default router;
