import OpenAI from 'openai'
import fs from 'fs/promises'
import path from 'path'
import { chunkText } from './text-chunker'

// TTS voice options
export type TTSVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'
export type TTSModel = 'tts-1' | 'tts-1-hd'

export interface AudiobookOptions {
  voice?: TTSVoice
  model?: TTSModel
  speed?: number
  outputFormat?: 'mp3' | 'opus' | 'aac' | 'flac' | 'wav' | 'pcm'
}

const DEFAULT_OPTIONS: Required<AudiobookOptions> = {
  voice: (process.env.AUDIOBOOK_VOICE as TTSVoice) || 'alloy',
  model: 'tts-1-hd',
  speed: 1.0,
  outputFormat: 'mp3',
}

/**
 * Initialize OpenAI client
 */
function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required for audiobook generation')
  }
  return new OpenAI({ apiKey })
}

/**
 * Generate audio from a single text chunk
 */
async function generateAudioChunk(
  text: string,
  chunkIndex: number,
  options: Required<AudiobookOptions>,
  tempDir: string
): Promise<string> {
  const client = getOpenAIClient()

  console.log(`[Audiobook] Generating chunk ${chunkIndex + 1} (${text.length} chars)...`)

  try {
    const response = await client.audio.speech.create({
      model: options.model,
      voice: options.voice,
      input: text,
      speed: options.speed,
      response_format: options.outputFormat,
    })

    // Convert response to buffer
    const buffer = Buffer.from(await response.arrayBuffer())

    // Save to temporary file
    const chunkPath = path.join(tempDir, `chunk-${chunkIndex}.${options.outputFormat}`)
    await fs.writeFile(chunkPath, buffer)

    console.log(`[Audiobook] Saved chunk ${chunkIndex + 1} to ${chunkPath}`)
    return chunkPath
  } catch (error: any) {
    console.error(`[Audiobook] Error generating chunk ${chunkIndex + 1}:`, error.message)
    throw new Error(`Failed to generate audio chunk ${chunkIndex + 1}: ${error.message}`)
  }
}

/**
 * Concatenate multiple audio files into a single file
 * Note: This is a simple binary concatenation which works for some formats
 * For proper MP3 concatenation, FFmpeg would be needed
 */
async function concatenateAudioFiles(
  chunkPaths: string[],
  outputPath: string,
  format: string
): Promise<void> {
  if (chunkPaths.length === 0) {
    throw new Error('No audio chunks to concatenate')
  }

  if (chunkPaths.length === 1) {
    // If only one chunk, just copy it
    await fs.copyFile(chunkPaths[0], outputPath)
    return
  }

  // For MP3 and other formats, we'll use a simple binary concatenation
  // This works for PCM/WAV but may not work perfectly for MP3
  // In production, consider using FFmpeg for proper concatenation
  const buffers = await Promise.all(
    chunkPaths.map(async (chunkPath) => {
      return await fs.readFile(chunkPath)
    })
  )

  // Concatenate all buffers
  const combinedBuffer = Buffer.concat(buffers)
  await fs.writeFile(outputPath, combinedBuffer)

  console.log(`[Audiobook] Concatenated ${chunkPaths.length} chunks into ${outputPath}`)
}

/**
 * Generate audiobook from text
 * @param text - Full text to convert to audiobook
 * @param outputPath - Path where final audiobook should be saved
 * @param options - TTS options (voice, model, speed, format)
 * @returns Path to generated audiobook file
 */
export async function generateAudiobook(
  text: string,
  outputPath: string,
  options: AudiobookOptions = {}
): Promise<string> {
  const finalOptions = { ...DEFAULT_OPTIONS, ...options }

  console.log(`[Audiobook] Starting generation for ${text.length} characters...`)
  console.log(`[Audiobook] Using voice: ${finalOptions.voice}, model: ${finalOptions.model}`)

  // Chunk the text
  const chunks = chunkText(text)
  console.log(`[Audiobook] Split into ${chunks.length} chunks`)

  if (chunks.length === 0) {
    throw new Error('No text chunks to process')
  }

  // Create temporary directory for chunks
  const tempDir = path.join(path.dirname(outputPath), 'temp-' + Date.now())
  await fs.mkdir(tempDir, { recursive: true })

  try {
    // Generate audio for each chunk
    const chunkPaths: string[] = []
    for (let i = 0; i < chunks.length; i++) {
      const chunkPath = await generateAudioChunk(chunks[i], i, finalOptions, tempDir)
      chunkPaths.push(chunkPath)

      // Add small delay to avoid rate limiting
      if (i < chunks.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    }

    // Ensure output directory exists
    await fs.mkdir(path.dirname(outputPath), { recursive: true })

    // Concatenate all chunks
    await concatenateAudioFiles(chunkPaths, outputPath, finalOptions.outputFormat)

    console.log(`[Audiobook] Successfully generated audiobook at ${outputPath}`)
    return outputPath
  } catch (error) {
    console.error('[Audiobook] Error during generation:', error)
    throw error
  } finally {
    // Clean up temporary files
    try {
      const files = await fs.readdir(tempDir)
      await Promise.all(files.map((file) => fs.unlink(path.join(tempDir, file))))
      await fs.rmdir(tempDir)
      console.log(`[Audiobook] Cleaned up temporary directory`)
    } catch (cleanupError) {
      console.warn('[Audiobook] Failed to clean up temporary files:', cleanupError)
    }
  }
}

/**
 * Generate audiobook from text chunks (for streaming/progressive generation)
 * @param chunks - Array of text chunks
 * @param outputPath - Path where final audiobook should be saved
 * @param options - TTS options
 * @param onProgress - Optional callback for progress updates
 */
export async function generateAudiobookFromChunks(
  chunks: string[],
  outputPath: string,
  options: AudiobookOptions = {},
  onProgress?: (current: number, total: number) => void
): Promise<string> {
  const finalOptions = { ...DEFAULT_OPTIONS, ...options }

  console.log(`[Audiobook] Generating from ${chunks.length} pre-chunked segments...`)

  // Create temporary directory
  const tempDir = path.join(path.dirname(outputPath), 'temp-' + Date.now())
  await fs.mkdir(tempDir, { recursive: true })

  try {
    const chunkPaths: string[] = []

    for (let i = 0; i < chunks.length; i++) {
      const chunkPath = await generateAudioChunk(chunks[i], i, finalOptions, tempDir)
      chunkPaths.push(chunkPath)

      // Report progress
      if (onProgress) {
        onProgress(i + 1, chunks.length)
      }

      // Small delay between chunks
      if (i < chunks.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    }

    // Ensure output directory exists
    await fs.mkdir(path.dirname(outputPath), { recursive: true })

    // Concatenate all chunks
    await concatenateAudioFiles(chunkPaths, outputPath, finalOptions.outputFormat)

    console.log(`[Audiobook] Successfully generated audiobook at ${outputPath}`)
    return outputPath
  } finally {
    // Clean up temporary files
    try {
      const files = await fs.readdir(tempDir)
      await Promise.all(files.map((file) => fs.unlink(path.join(tempDir, file))))
      await fs.rmdir(tempDir)
    } catch (cleanupError) {
      console.warn('[Audiobook] Failed to clean up temporary files:', cleanupError)
    }
  }
}

