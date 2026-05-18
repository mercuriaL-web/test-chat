import { Router } from 'express';
import multer from 'multer';
import { transcribeAudio } from '../services/groq.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

export const transcribeRouter = Router();

transcribeRouter.post(
  '/transcribe',
  upload.single('audio'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'Audio file is required' });
        return;
      }

      const text = await transcribeAudio(
        req.file.buffer,
        req.file.mimetype || 'audio/webm'
      );
      res.json({ text });
    } catch (err) {
      next(err);
    }
  }
);
