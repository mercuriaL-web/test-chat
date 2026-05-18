import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import './env.js';
import cors from 'cors';
import express from 'express';
import { chatRouter } from './routes/chat.js';
import { transcribeRouter } from './routes/transcribe.js';
import { errorHandler } from './middleware/errorHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(__dirname, '../../client/dist');

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  })
);
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api', chatRouter);
app.use('/api', transcribeRouter);

if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[server] Listening on http://localhost:${PORT}`);
});
