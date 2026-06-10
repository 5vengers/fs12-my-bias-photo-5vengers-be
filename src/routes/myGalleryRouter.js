import { Router } from 'express';

import { asyncHandler } from '../middlewares/asyncHandler.js';
import { authenticate } from '../middlewares/authenticate.js';
import { validate } from '../middlewares/validate.js';
import { createCardSchema } from '../schemas/myGallerySchema.js';

import myGalleryController from '../controllers/myGalleryController.js';

const router = Router();

router.get('/', asyncHandler(myGalleryController.getMyGallery));
router.post(
  '/create',
  validate(createCardSchema),
  asyncHandler(myGalleryController.createPhotoCard),
);

router.get('/creationLog', asyncHandler(myGalleryController.getLog));

export default router;
