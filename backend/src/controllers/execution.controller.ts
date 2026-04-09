import { Response } from 'express';
import { z } from 'zod';
import { runCodeInSandbox } from '../services/execution.service';
import { AuthRequest } from '../middlewares/auth.middleware';

const executeSchema = z.object({
  code: z.string().min(1).max(50000),
  language: z.enum(['javascript', 'python', 'typescript']),
});

// POST /api/execute
export const executeCode = async (req: AuthRequest, res: Response) => {
  try {
    const { code, language } = executeSchema.parse(req.body);

    const output = await runCodeInSandbox(code, language);
    return res.status(200).json({ output, language, success: true });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Invalid input', errors: error.errors });
    }
    const message = typeof error === 'string' ? error : error.message || 'Execution failed';
    return res.status(500).json({ output: `Error: ${message}`, success: false });
  }
};
