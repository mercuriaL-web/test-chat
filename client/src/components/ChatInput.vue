<script setup lang="ts">
import { computed, ref } from 'vue'
import { useVoiceInput } from '../composables/useVoiceInput'

const props = defineProps<{
  isLoading: boolean
}>()

const emit = defineEmits<{
  send: [text: string]
}>()

const inputText = ref('')

const {
  isSupported: voiceSupported,
  isRecording,
  isTranscribing,
  error: voiceError,
  toggle: toggleVoice,
  clearError: clearVoiceError,
} = useVoiceInput({
  getText: () => inputText.value,
  setText: (text) => {
    inputText.value = text
  },
})

const canSend = computed(
  () => inputText.value.trim().length > 0 && !props.isLoading && !isTranscribing.value
)

const micTitle = computed(() => {
  if (isTranscribing.value) return 'Finalizing...'
  if (isRecording.value) return 'Stop recording'
  return 'Voice input'
})

function handleSubmit(): void {
  if (!canSend.value) return
  emit('send', inputText.value.trim())
  inputText.value = ''
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    handleSubmit()
  }
}
</script>

<template>
  <div class="px-6 pb-8 pt-2 md:px-12">
    <div
      v-if="voiceError"
      class="mx-auto mb-3 flex max-w-3xl items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-100"
    >
      <span>{{ voiceError }}</span>
      <button
        type="button"
        class="shrink-0 text-amber-200/80 hover:text-white"
        @click="clearVoiceError"
      >
        Dismiss
      </button>
    </div>

    <form
      class="mx-auto flex max-w-3xl items-center gap-2 rounded-full bg-navy-input px-3 py-2 shadow-lg ring-1 ring-white/10"
      @submit.prevent="handleSubmit"
    >
      <button
        v-if="voiceSupported"
        type="button"
        :disabled="isLoading || isTranscribing"
        :title="micTitle"
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition hover:bg-white/10 disabled:opacity-40"
        :class="{
          'mic-recording ring-2 ring-red-400/80': isRecording,
          'bg-white/10': isTranscribing && !isRecording,
        }"
        @click="toggleVoice"
      >
        <img
          v-if="!isTranscribing"
          src="/icons/microphone.png"
          width="24"
          height="24"
          alt=""
          class="h-6 w-6 object-contain brightness-0 invert"
          aria-hidden="true"
        />
        <svg
          v-else
          class="h-5 w-5 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      </button>

      <input
        v-model="inputText"
        type="text"
        :disabled="isLoading || isTranscribing"
        placeholder="Ask whatever you want"
        class="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-white placeholder:text-white/40 outline-none disabled:opacity-50 md:text-base"
        @keydown="handleKeydown"
      />

      <button
        type="submit"
        :disabled="!canSend"
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy-send text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
        title="Send"
      >
        <svg
          v-if="!isLoading"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          class="h-5 w-5"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="m8.25 4.5 7.5 7.5-7.5 7.5"
          />
        </svg>
        <svg
          v-else
          class="h-5 w-5 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      </button>
    </form>

    <p
      v-if="!voiceSupported"
      class="mx-auto mt-2 max-w-3xl text-center text-xs text-white/30"
    >
      Voice input is not supported in this browser.
    </p>
    <p
      v-else-if="isRecording"
      class="mx-auto mt-2 max-w-3xl text-center text-xs text-white/50"
    >
      Listening... text updates as you speak. Click the mic to stop.
    </p>
  </div>
</template>
