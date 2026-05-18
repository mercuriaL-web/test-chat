import { ref } from 'vue'
import type { ChatApiError, ChatApiResponse, ChatMessage } from '../types/chat'

export function useChat() {
  const messages = ref<ChatMessage[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const lastUserMessage = ref<string | null>(null)

  function createId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  }

  async function sendMessage(text: string): Promise<void> {
    const trimmed = text.trim()
    if (!trimmed || isLoading.value) return

    error.value = null
    lastUserMessage.value = trimmed

    const userMessage: ChatMessage = {
      id: createId(),
      role: 'user',
      content: trimmed,
    }
    messages.value.push(userMessage)
    isLoading.value = true

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      })

      const data = (await response.json()) as ChatApiResponse | ChatApiError

      if (!response.ok) {
        const apiError = data as ChatApiError
        throw new Error(apiError.error ?? `Request failed (${response.status})`)
      }

      const { reply } = data as ChatApiResponse
      messages.value.push({
        id: createId(),
        role: 'assistant',
        content: reply,
      })
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Failed to send message. Try again.'
    } finally {
      isLoading.value = false
    }
  }

  async function retryLast(): Promise<void> {
    if (!lastUserMessage.value) return
    if (messages.value.at(-1)?.role === 'user') {
      messages.value.pop()
    }
    await sendMessage(lastUserMessage.value)
  }

  function clearError(): void {
    error.value = null
  }

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    retryLast,
    clearError,
  }
}
