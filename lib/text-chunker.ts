/**
 * Chunks text into segments suitable for TTS API
 * OpenAI TTS API has a 4096 character limit per request
 */

const MAX_CHUNK_SIZE = 4000 // Leave some buffer below 4096 limit
const SENTENCE_ENDINGS = /[.!?]\s+/g
const PARAGRAPH_BREAK = /\n\s*\n/

/**
 * Splits text into chunks that respect sentence boundaries
 * Ensures chunks are under the TTS API character limit
 * @param text - Text to chunk
 * @returns Array of text chunks
 */
export function chunkText(text: string): string[] {
  if (!text || text.trim().length === 0) {
    return []
  }

  // Normalize whitespace
  const normalizedText = text.replace(/\s+/g, ' ').trim()

  // If text is small enough, return as single chunk
  if (normalizedText.length <= MAX_CHUNK_SIZE) {
    return [normalizedText]
  }

  const chunks: string[] = []
  let currentChunk = ''
  let lastSentenceEnd = 0

  // Split by paragraphs first for better natural breaks
  const paragraphs = normalizedText.split(PARAGRAPH_BREAK)

  for (const paragraph of paragraphs) {
    const trimmedParagraph = paragraph.trim()

    // If paragraph alone exceeds limit, split by sentences
    if (trimmedParagraph.length > MAX_CHUNK_SIZE) {
      // Save current chunk if it has content
      if (currentChunk.trim().length > 0) {
        chunks.push(currentChunk.trim())
        currentChunk = ''
      }

      // Split long paragraph by sentences
      const sentences = splitBySentences(trimmedParagraph)
      for (const sentence of sentences) {
        if (currentChunk.length + sentence.length + 1 <= MAX_CHUNK_SIZE) {
          currentChunk += (currentChunk ? ' ' : '') + sentence
        } else {
          if (currentChunk.trim().length > 0) {
            chunks.push(currentChunk.trim())
          }
          currentChunk = sentence
        }
      }
    } else {
      // Check if adding this paragraph would exceed limit
      const wouldExceed = currentChunk.length + trimmedParagraph.length + 2 > MAX_CHUNK_SIZE

      if (wouldExceed && currentChunk.trim().length > 0) {
        chunks.push(currentChunk.trim())
        currentChunk = trimmedParagraph
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + trimmedParagraph
      }
    }
  }

  // Add remaining chunk
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim())
  }

  // Final safety check: if any chunk is still too large, force split
  const finalChunks: string[] = []
  for (const chunk of chunks) {
    if (chunk.length <= MAX_CHUNK_SIZE) {
      finalChunks.push(chunk)
    } else {
      // Force split at character boundary (last resort)
      const forcedChunks = forceSplit(chunk)
      finalChunks.push(...forcedChunks)
    }
  }

  return finalChunks
}

/**
 * Splits text by sentence boundaries
 * @param text - Text to split
 * @returns Array of sentences
 */
function splitBySentences(text: string): string[] {
  const sentences: string[] = []
  let lastIndex = 0
  let match

  // Reset regex
  SENTENCE_ENDINGS.lastIndex = 0

  while ((match = SENTENCE_ENDINGS.exec(text)) !== null) {
    const sentence = text.substring(lastIndex, match.index + match[0].length).trim()
    if (sentence.length > 0) {
      sentences.push(sentence)
    }
    lastIndex = match.index + match[0].length
  }

  // Add remaining text
  const remaining = text.substring(lastIndex).trim()
  if (remaining.length > 0) {
    sentences.push(remaining)
  }

  return sentences.length > 0 ? sentences : [text]
}

/**
 * Force splits text at character boundaries (last resort)
 * @param text - Text to split
 * @returns Array of text chunks
 */
function forceSplit(text: string): string[] {
  const chunks: string[] = []
  let start = 0

  while (start < text.length) {
    const end = Math.min(start + MAX_CHUNK_SIZE, text.length)
    let chunk = text.substring(start, end)

    // Try to break at a space near the end
    if (end < text.length) {
      const lastSpace = chunk.lastIndexOf(' ')
      if (lastSpace > MAX_CHUNK_SIZE * 0.8) {
        chunk = chunk.substring(0, lastSpace)
        start += lastSpace + 1
      } else {
        start = end
      }
    } else {
      start = end
    }

    chunks.push(chunk.trim())
  }

  return chunks
}

/**
 * Estimates the number of chunks needed for a given text
 * @param text - Text to estimate
 * @returns Estimated number of chunks
 */
export function estimateChunkCount(text: string): number {
  if (!text || text.length === 0) {
    return 0
  }
  return Math.ceil(text.length / MAX_CHUNK_SIZE)
}

