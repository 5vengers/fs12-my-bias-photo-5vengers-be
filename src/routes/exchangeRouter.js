import express from 'express';
import { exchangeController } from '../controllers/exchangeController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { validate } from '../middlewares/validate.js';
import { createExchangeSchema } from '../schemas/exchangeSchema.js';

const router = express.Router();

router.post(
  '/market/items/:itemId/exchanges',
  authenticate,
  validate(createExchangeSchema),
  asyncHandler(exchangeController.create),
);

router.get(
  '/exchanges/sent',
  authenticate,
  asyncHandler(exchangeController.findSent),
);

router.get(
  '/exchanges/received',
  authenticate,
  asyncHandler(exchangeController.findReceived),
);

router.patch(
  '/exchanges/:exchangeId/approve',
  authenticate,
  asyncHandler(exchangeController.approve),
);

export default router;
