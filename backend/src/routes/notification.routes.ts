import { Router } from 'express';
import { getUserNotifications, respondToInvitation } from '../controllers/notification.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(verifyToken);

router.get('/', getUserNotifications);
router.post('/:id/respond', respondToInvitation);

export default router;
