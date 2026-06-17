import { asyncHandler } from '../middlewares/asyncHandler.js';
import { notificationService } from '../services/notificationService.js';
import { sseManager } from '../libs/sseManager.js';
import { AppError } from '../errors/appError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';

/**
 * GET /api/notifications/stream
 * SSE 연결 수립
 *
 * flushHeaders() 이후에는 JSON 에러 응답이 불가하므로
 * 인증은 sseAuthenticate 미들웨어에서 사전 처리합니다.
 */
const stream = asyncHandler(async (req, res) => {
  const { userId } = req.user;

  res.setHeader('Content-Type', 'text/event-stream'); // SSE
  res.setHeader('Cache-Control', 'no-cache'); // 캐시 금지
  res.setHeader('Connection', 'keep-alive'); // 연결 유지
  res.setHeader('X-Accel-Buffering', 'no'); // Nginx 버퍼링 비활성화
  res.flushHeaders(); // 헤더 즉시 전송

  sseManager.add(userId, res);

  // 연결 즉시 미읽은 알림 수 전송 (클라이언트 배지 초기화)
  try {
    const unreadCount = await notificationService.getUnreadCount(userId);
    res.write(`event: connected\ndata: ${JSON.stringify({ unreadCount })}\n\n`);
  } catch (err) {
    console.error('[SSE] connected 이벤트 전송 실패:', err);
    res.write(`event: connected\ndata: ${JSON.stringify({ unreadCount: 0 })}\n\n`);
  }

  // 30초마다 주석 ping으로 연결 유지 (프록시/방화벽 타임아웃 방지)
  const heartbeat = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      clearInterval(heartbeat);
    }
  }, 30_000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseManager.remove(userId, res);
  });
});

/**
 * GET /api/notifications?page=1&limit=20
 * 알림 목록 조회 (최신순, 페이지네이션)
 */
const getNotifications = asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

  const result = await notificationService.getNotifications(userId, { page, limit });

  res.json({ success: true, data: result });
});

/**
 * GET /api/notifications/unread-count
 * 미읽은 알림 수만 조회 (헤더 배지용 경량 엔드포인트)
 */
const getUnreadCount = asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const unreadCount = await notificationService.getUnreadCount(userId);
  res.json({ success: true, data: { unreadCount } });
});

/**
 * PATCH /api/notifications/read
 * 전체 읽음 처리
 */
const markAllAsRead = asyncHandler(async (req, res) => {
  const { userId } = req.user;
  await notificationService.markAllAsRead(userId);
  res.json({ success: true, message: '모든 알림을 읽음 처리했습니다.' });
});

/**
 * PATCH /api/notifications/:id/read
 * 단일 읽음 처리
 */
const markRead = asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError('유효하지 않은 알림 ID입니다.', 400, ERROR_CODES.VALIDATION_ERROR);
  }

  const result = await notificationService.markAsRead(id, userId);

  // updateMany count가 0이면 본인 알림이 아니거나 존재하지 않음
  if (result.count === 0) {
    throw new AppError('알림을 찾을 수 없습니다.', 404, ERROR_CODES.NOT_FOUND);
  }

  res.json({ success: true, message: '알림을 읽음 처리했습니다.' });
});

export default { stream, getNotifications, getUnreadCount, markAllAsRead, markRead };