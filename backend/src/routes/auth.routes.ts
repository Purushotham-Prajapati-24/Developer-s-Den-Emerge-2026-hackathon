import { Router } from 'express';
import {
  register,
  login,
  clerkSync,
  completeOnboarding,
  refreshAccessToken,
  logout,
} from '../controllers/auth.controller';
import { verifyToken } from '../middlewares/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/clerk-sync', clerkSync);
router.post('/onboard', verifyToken, completeOnboarding);
router.post('/refresh', refreshAccessToken);
router.post('/logout', logout);

export default router;
