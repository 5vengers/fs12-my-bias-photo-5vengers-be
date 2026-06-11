import express from 'express';
import { orderController } from '../controllers/orderController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { validate } from '../middlewares/validate.js';
import { purchaseSchema } from '../schemas/orderSchema.js';

const router = express.Router();

router.post(
  '/market/items/:itemId/purchase',
  authenticate,
  validate(purchaseSchema),
  asyncHandler(orderController.purchase),
);

export default router;
