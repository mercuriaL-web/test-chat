import { Router } from 'express';
import { z } from 'zod';
import { getChatReply } from '../services/groq.js';

const chatBodySchema = z.object({
  message: z
    .string({ required_error: 'Message is required' })
    .trim()
    .min(1, 'Message cannot be empty')
    .max(4000, 'Message is too long'),
});

export const chatRouter = Router();

chatRouter.post('/chat', async (req, res, next) => {
  try {
    const { message } = chatBodySchema.parse(req.body);
    const reply = await getChatReply(message);
    res.json({ reply });
  } catch (err) {
    next(err);
  }
});
