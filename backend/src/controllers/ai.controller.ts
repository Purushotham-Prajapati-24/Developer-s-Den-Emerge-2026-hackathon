import { Response } from 'express';
import { z } from 'zod';
import { requestCodeSuggestion, requestChatResponse, requestTerminalAnalysis, requestWebGeneration } from '../services/ai.service';
import { AuthRequest } from '../middlewares/auth.middleware';

const suggestSchema = z.object({
  codeContext: z.string().min(1).max(10000),
  cursorContext: z.string().max(500).default(''),
});

const chatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string().min(1).max(20000),
  })).min(1),
  codeContext: z.string().max(50000).optional(),
  context: z.object({
    activeFile: z.object({
      name: z.string(),
      content: z.string().optional().nullable(),
      focusedContent: z.string().optional().nullable(),
      range: z.object({ start: z.number(), end: z.number() }).nullable().optional()
    }).optional(),
    recentFiles: z.array(z.object({
      name: z.string(),
      content: z.string()
    })).optional(),
    terminalOutput: z.string().nullable().optional()
  }).optional()
});

// POST /api/ai/suggest
export const getSuggestion = async (req: AuthRequest, res: Response) => {
  try {
    const { codeContext, cursorContext } = suggestSchema.parse(req.body);

    const suggestion = await requestCodeSuggestion(codeContext, cursorContext);
    return res.status(200).json({ suggestion });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Invalid input', errors: error.errors });
    }
    return res.status(500).json({ message: 'AI suggestion failed' });
  }
};

// POST /api/ai/chat
export const getChatResponse = async (req: AuthRequest, res: Response) => {
  try {
    const { messages, codeContext, context } = chatSchema.parse(req.body);
    const response = await requestChatResponse(messages, codeContext, context);
    return res.status(200).json({ response });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Invalid chat context', errors: error.errors });
    }
    console.error('AI Chat Error:', error);
    return res.status(500).json({ message: 'AI chat failed' });
  }
};

const webGenSchema = z.object({
  prompt: z.string().min(1).max(5000),
  codeContext: z.string().max(500000).default(''),
});

// POST /api/ai/web-generate
export const getWebGeneration = async (req: AuthRequest, res: Response) => {
  try {
    const { prompt, codeContext } = webGenSchema.parse(req.body);
    const response = await requestWebGeneration(prompt, codeContext);
    return res.status(200).json({ response });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Invalid web generation request', errors: error.errors });
    }
    return res.status(500).json({ message: 'AI Web Generation failed' });
  }
};

const analyzeSchema = z.object({
  terminalOutput: z.string().min(1).max(50000),
  query: z.string().max(1000).optional(),
});

// POST /api/ai/analyze-terminal
export const getTerminalAnalysis = async (req: AuthRequest, res: Response) => {
  try {
    const { terminalOutput, query } = analyzeSchema.parse(req.body);
    const analysis = await requestTerminalAnalysis(terminalOutput, query);
    return res.status(200).json({ analysis });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Invalid analysis request', errors: error.errors });
    }
    return res.status(500).json({ message: 'Terminal analysis failed' });
  }
};
