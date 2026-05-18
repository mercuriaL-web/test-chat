import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ChatServiceError } from '../services/groq.js';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: err.errors.map((e) => e.message).join(', ') || 'Invalid request',
    });
    return;
  }

  if (err instanceof ChatServiceError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  console.error('[server] Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
}
