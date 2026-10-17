import express from 'express';
import { getMyNotifications, markAsRead, deleteNotification, testMyDeviceNotification } from '../controllers/notificationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getMyNotifications);
router.post('/test-my-device', testMyDeviceNotification);
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

export default router;
