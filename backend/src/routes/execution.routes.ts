import { Router } from 'express';
import { executeCode } from '../controllers/execution.controller';
import { verifyToken } from '../middlewares/auth.middleware';
import rateLimit from 'express-rate-limit';

const executionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: { message: 'Too many execution requests. Please wait before running again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();

router.post('/', verifyToken, executionLimiter, executeCode);

export default router;
