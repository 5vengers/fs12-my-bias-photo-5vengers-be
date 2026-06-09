import { Router } from 'express';
import pointController from '../controllers/pointController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { validate } from '../middlewares/validate.js';
import { openPointBoxSchema } from '../schemas/pointBoxSchema.js';

const router = Router();

router.get('/me', authenticate, pointController.getMyPoint);

router.post(
  '/box',
  authenticate,
  validate(openPointBoxSchema),
  pointController.openPointBox,
);

export default router;
