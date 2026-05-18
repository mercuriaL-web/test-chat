import '../env.js';
import OpenAI, { toFile } from 'openai';

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const WHISPER_MODEL = 'whisper-large-v3-turbo';

let client: OpenAI | null | undefined;

function getGroqClient(): OpenAI | null {
  if (client === undefined) {
    const apiKey = process.env.GROQ_API_KEY?.trim();
    client = apiKey
      ? new OpenAI({ apiKey, baseURL: GROQ_BASE_URL })
      : null;
    if (!client) {
      console.warn('[server] GROQ_API_KEY is not set. Chat requests will fail.');
    }
  }
  return client;
}

export class ChatServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = 'ChatServiceError';
  }
}

export async function getChatReply(userMessage: string): Promise<string> {
  const groq = getGroqClient();
  if (!groq) {
    throw new ChatServiceError(
      'Groq API key is not configured. Set GROQ_API_KEY in .env',
      500
    );
  }

  try {
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant. Answer concisely and clearly in the same language as the user.',
        },
        { role: 'user', content: userMessage },
      ],
      max_tokens: 1024,
    });

    const reply = completion.choices[0]?.message?.content?.trim();
    if (!reply) {
      throw new ChatServiceError('Empty response from Groq', 502);
    }
    return reply;
  } catch (err) {
    if (err instanceof ChatServiceError) throw err;

    const error = err as { status?: number; message?: string };
    const status = error.status ?? 502;

    if (status === 401) {
      throw new ChatServiceError('Invalid API key. Check GROQ_API_KEY in .env', 502);
    }
    if (status === 429) {
      throw new ChatServiceError('Rate limit exceeded. Try again later.', 502);
    }

    throw new ChatServiceError(
      error.message ?? 'Failed to get response from Groq',
      502
    );
  }
}

function extensionForMime(mimeType: string): string {
  if (mimeType.includes('webm')) return 'webm';
  if (mimeType.includes('ogg')) return 'ogg';
  if (mimeType.includes('mp4') || mimeType.includes('m4a')) return 'm4a';
  if (mimeType.includes('wav')) return 'wav';
  return 'webm';
}

export async function transcribeAudio(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  const groq = getGroqClient();
  if (!groq) {
    throw new ChatServiceError(
      'Groq API key is not configured. Set GROQ_API_KEY in .env',
      500
    );
  }

  try {
    const ext = extensionForMime(mimeType);
    const file = await toFile(buffer, `audio.${ext}`, { type: mimeType });

    const result = await groq.audio.transcriptions.create({
      file,
      model: WHISPER_MODEL,
      language: 'ru',
      response_format: 'json',
    });

    const text = result.text?.trim();
    if (!text) {
      throw new ChatServiceError('Could not recognize speech', 502);
    }
    return text;
  } catch (err) {
    if (err instanceof ChatServiceError) throw err;

    const error = err as { status?: number; message?: string };
    const status = error.status ?? 502;

    if (status === 401) {
      throw new ChatServiceError('Invalid API key. Check GROQ_API_KEY in .env', 502);
    }
    if (status === 429) {
      throw new ChatServiceError('Rate limit exceeded. Try again later.', 502);
    }

    throw new ChatServiceError(
      error.message ?? 'Failed to transcribe audio',
      502
    );
  }
}
