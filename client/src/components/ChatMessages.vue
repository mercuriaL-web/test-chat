<script setup lang="ts">
import type { ChatMessage } from '../types/chat'

defineProps<{
  messages: ChatMessage[]
  isLoading: boolean
}>()
</script>

<template>
  <section
    v-if="messages.length > 0 || isLoading"
    class="flex-1 overflow-y-auto px-6 pb-4 pt-6 md:px-12 md:pt-8"
  >
    <ul class="mx-auto flex max-w-3xl flex-col gap-4">
      <li
        v-for="msg in messages"
        :key="msg.id"
        class="flex"
        :class="msg.role === 'user' ? 'justify-end' : 'justify-start'"
      >
        <div
          class="max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed md:max-w-[75%] md:text-base"
          :class="
            msg.role === 'user'
              ? 'bg-navy-send text-white'
              : 'bg-white/10 text-white/95'
          "
        >
          {{ msg.content }}
        </div>
      </li>
      <li v-if="isLoading" class="flex justify-start">
        <div
          class="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm text-white/70"
        >
          <span
            class="inline-block h-2 w-2 animate-pulse rounded-full bg-white/60"
          />
          <span
            class="inline-block h-2 w-2 animate-pulse rounded-full bg-white/60 [animation-delay:150ms]"
          />
          <span
            class="inline-block h-2 w-2 animate-pulse rounded-full bg-white/60 [animation-delay:300ms]"
          />
        </div>
      </li>
    </ul>
  </section>
</template>
