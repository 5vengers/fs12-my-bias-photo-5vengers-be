import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.js';
import { sseAuthenticate } from '../middlewares/sseAuthenticate.js';
import notificationController from '../controllers/notificationController.js';

const router = Router();

// SSE: 브라우저 EventSource 지원을 위해 별도 sseAuthenticate 사용
router.get('/stream', sseAuthenticate, notificationController.stream);

router.get('/', authenticate, notificationController.getNotifications);
router.get(
  '/unread-count',
  authenticate,
  notificationController.getUnreadCount,
);
router.patch('/read', authenticate, notificationController.markAllAsRead);
router.patch('/:id/read', authenticate, notificationController.markAsRead);

export default router;