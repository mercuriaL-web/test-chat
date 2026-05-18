<script setup lang="ts">
import { computed } from 'vue'
import ChatHeader from './components/ChatHeader.vue'
import ChatInput from './components/ChatInput.vue'
import ChatMessages from './components/ChatMessages.vue'
import { useChat } from './composables/useChat'

const { messages, isLoading, error, sendMessage, retryLast, clearError } =
  useChat()

const hasMessages = computed(() => messages.value.length > 0)

async function handleSend(text: string): Promise<void> {
  await sendMessage(text)
}
</script>

<template>
  <div class="flex min-h-full flex-col bg-navy text-white">
    <ChatHeader v-if="!hasMessages" />

    <ChatMessages :messages="messages" :is-loading="isLoading" />

    <div v-if="error" class="px-6 md:px-12">
      <div
        class="mx-auto mb-2 flex w-full max-w-3xl items-center justify-between gap-3 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100"
      >
        <span>{{ error }}</span>
        <div class="flex shrink-0 gap-2">
          <button
            type="button"
            class="rounded-lg bg-white/10 px-3 py-1 text-xs hover:bg-white/20"
            @click="retryLast"
          >
            Retry
          </button>
          <button
            type="button"
            class="rounded-lg px-2 py-1 text-xs text-red-200/80 hover:text-white"
            @click="clearError"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>

    <div class="mt-auto">
      <ChatInput :is-loading="isLoading" @send="handleSend" />
    </div>
  </div>
</template>
