import express from 'express';
import { marketController } from '../controllers/marketController.js';

const router = express.Router();

router.get('/market/items', marketController.getMarketItems);
router.get('/market/items/:itemId', marketController.getMarketItemDetail);
router.post('/market/items', marketController.createMarketItem);
router.patch('/market/items/:itemId', marketController.updateMarketItem);
router.delete('/market/items/:itemId', marketController.deleteMarketItem);

export default router;
