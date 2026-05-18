import { computed, onUnmounted, ref } from 'vue'

const PARTIAL_INTERVAL_MS = 2500
const MIN_PARTIAL_BYTES = 2000

interface VoiceInputOptions {
  getText: () => string
  setText: (text: string) => void
}

export function useVoiceInput({ getText, setText }: VoiceInputOptions) {
  const isSupported = ref(
    typeof navigator !== 'undefined' &&
      Boolean(navigator.mediaDevices?.getUserMedia) &&
      typeof MediaRecorder !== 'undefined'
  )
  const isRecording = ref(false)
  const isTranscribing = ref(false)
  const error = ref<string | null>(null)

  const isBusy = computed(() => isTranscribing.value)

  let mediaRecorder: MediaRecorder | null = null
  let audioChunks: Blob[] = []
  let mediaStream: MediaStream | null = null
  let prefixText = ''
  let mimeType = ''
  let partialInFlight = false
  let transcribeGeneration = 0

  function getMimeType(): string {
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      return 'audio/webm;codecs=opus'
    }
    if (MediaRecorder.isTypeSupported('audio/webm')) return 'audio/webm'
    if (MediaRecorder.isTypeSupported('audio/mp4')) return 'audio/mp4'
    return ''
  }

  function stopStream(): void {
    mediaStream?.getTracks().forEach((track) => track.stop())
    mediaStream = null
  }

  function applyTranscript(transcript: string): void {
    const text = transcript.trim()
    if (!text) return
    setText(prefixText ? `${prefixText} ${text}`.trim() : text)
  }

  async function requestTranscript(blob: Blob, type: string): Promise<string> {
    const ext = type.includes('webm')
      ? 'webm'
      : type.includes('mp4')
        ? 'm4a'
        : 'ogg'

    const formData = new FormData()
    formData.append('audio', blob, `recording.${ext}`)

    const response = await fetch('/api/transcribe', {
      method: 'POST',
      body: formData,
    })

    const data = (await response.json()) as { text?: string; error?: string }

    if (!response.ok) {
      throw new Error(data.error ?? `Transcription failed (${response.status})`)
    }

    const text = data.text?.trim()
    if (!text) {
      throw new Error('No speech detected. Try again.')
    }
    return text
  }

  async function runPartialTranscribe(generation: number): Promise<void> {
    if (partialInFlight || !isRecording.value) return
    if (audioChunks.length === 0) return

    const blob = new Blob(audioChunks, { type: mimeType })
    if (blob.size < MIN_PARTIAL_BYTES) return

    partialInFlight = true
    try {
      const text = await requestTranscript(blob, mimeType)
      if (generation === transcribeGeneration && isRecording.value) {
        applyTranscript(text)
      }
    } catch {
      // Partial failures are silent; final pass will surface errors.
    } finally {
      partialInFlight = false
    }
  }

  async function runFinalTranscribe(blob: Blob, generation: number): Promise<void> {
    isTranscribing.value = true
    error.value = null

    try {
      const text = await requestTranscript(blob, mimeType)
      if (generation === transcribeGeneration) {
        applyTranscript(text)
      }
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Voice recognition failed.'
    } finally {
      isTranscribing.value = false
    }
  }

  async function startRecording(): Promise<void> {
    error.value = null
    mimeType = getMimeType()
    if (!mimeType) {
      error.value = 'Audio recording is not supported in this browser.'
      return
    }

    try {
      prefixText = getText().trim()
      transcribeGeneration += 1
      const generation = transcribeGeneration

      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioChunks = []
      mediaRecorder = new MediaRecorder(mediaStream, { mimeType })

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data)
          if (isRecording.value) {
            void runPartialTranscribe(generation)
          }
        }
      }

      mediaRecorder.onstop = () => {
        stopStream()
        const blob = new Blob(audioChunks, { type: mimeType })
        if (blob.size > 0) {
          void runFinalTranscribe(blob, generation)
        } else if (generation === transcribeGeneration) {
          error.value = 'No audio recorded. Try again.'
        }
      }

      mediaRecorder.onerror = () => {
        isRecording.value = false
        error.value = 'Recording failed.'
        stopStream()
      }

      mediaRecorder.start(PARTIAL_INTERVAL_MS)
      isRecording.value = true
    } catch {
      isRecording.value = false
      stopStream()
      error.value =
        'Microphone access denied. Allow microphone in browser settings.'
    }
  }

  function stopRecording(): void {
    if (mediaRecorder?.state === 'recording') {
      mediaRecorder.stop()
    }
    isRecording.value = false
  }

  function toggle(): void {
    if (isTranscribing.value) return
    if (isRecording.value) {
      stopRecording()
    } else {
      void startRecording()
    }
  }

  function clearError(): void {
    error.value = null
  }

  onUnmounted(() => {
    transcribeGeneration += 1
    if (mediaRecorder?.state === 'recording') {
      mediaRecorder.stop()
    }
    stopStream()
  })

  return {
    isSupported,
    isRecording,
    isTranscribing,
    isBusy,
    error,
    toggle,
    clearError,
  }
}
