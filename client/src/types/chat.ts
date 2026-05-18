export type MessageRole = 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
}

export interface ChatApiResponse {
  reply: string
}

export interface ChatApiError {
  error: string
}
