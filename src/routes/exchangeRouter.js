import express from 'express';
import { exchangeController } from '../controllers/exchangeController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { validate } from '../middlewares/validate.js';
import {
  createExchangeSchema,
  marketItemIdParamSchema,
  exchangeIdParamSchema,
} from '../schemas/exchangeSchema.js';

const router = express.Router();

router.post(
  '/market/items/:itemId/exchanges',
  authenticate,
  validate(marketItemIdParamSchema, 'params'),
  validate(createExchangeSchema),
  asyncHandler(exchangeController.create),
);

router.patch(
  '/exchanges/:exchangeId/approve',
  authenticate,
  validate(exchangeIdParamSchema, 'params'),
  asyncHandler(exchangeController.approve),
);

router.patch(
  '/exchanges/:exchangeId/reject',
  authenticate,
  validate(exchangeIdParamSchema, 'params'),
  asyncHandler(exchangeController.reject),
);

router.patch(
  '/exchanges/:exchangeId/cancel',
  authenticate,
  validate(exchangeIdParamSchema, 'params'),
  asyncHandler(exchangeController.cancel),
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

router.get(
  '/exchanges/:exchangeId',
  authenticate,
  validate(exchangeIdParamSchema, 'params'),
  asyncHandler(exchangeController.findOne),
);

export default router;
