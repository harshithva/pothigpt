// Content generation functions for all book types
import { chatCompletion } from '@/lib/openrouter'
import { formatText, cleanIntro, cleanSubsection } from './utils'
import type { NonFictionPrompts, FictionPrompts, GeneratedBookContent } from './types'

/**
 * Generate introduction content for non-fiction books
 */
export async function generateIntroduction(introPrompt: string): Promise<string> {
  if (!introPrompt || !introPrompt.trim()) {
    return ''
  }

  console.log('[Content Generator] Generating introduction...')
  // 1500 words ≈ 6000 tokens (roughly 4 tokens per word)
  const content = await chatCompletion(
    [{ role: 'user', content: introPrompt }],
    { temperature: 0.7, max_tokens: 6000 }
  )

  return formatText(content)
}

/**
 * Generate chapter introduction for non-fiction books
 */
export async function generateChapterIntroduction(chapterIntroPrompt: string): Promise<string> {
  if (!chapterIntroPrompt || !chapterIntroPrompt.trim()) {
    return ''
  }

  console.log('[Content Generator] Generating chapter introduction...')
  // 200 words ≈ 800 tokens
  const content = await chatCompletion(
    [{ role: 'user', content: chapterIntroPrompt }],
    { temperature: 0.7, max_tokens: 1000 }
  )

  return cleanIntro(formatText(content), '')
}

/**
 * Generate subheading content for non-fiction books
 */
export async function generateSubheadingContent(subheadingPrompt: string, subheadingTitle: string): Promise<string> {
  if (!subheadingPrompt || !subheadingPrompt.trim()) {
    return ''
  }

  console.log(`[Content Generator] Generating subheading: ${subheadingTitle}`)
  // 500 words ≈ 2000 tokens, but increase to 3000 to ensure full content
  const content = await chatCompletion(
    [{ role: 'user', content: subheadingPrompt }],
    { temperature: 0.7, max_tokens: 3000 }
  )

  return cleanSubsection(formatText(content), subheadingTitle)
}

/**
 * Generate full non-fiction book content from prompts
 */
export async function generateNonFictionContent(
  prompts: NonFictionPrompts
): Promise<GeneratedBookContent> {
  console.log(`[Content Generator] Generating non-fiction book: ${prompts.bookTitle}`)

  const content: GeneratedBookContent = {
    chapters: []
  }

  // Generate introduction
  if (prompts.introPrompt) {
    content.introduction = await generateIntroduction(prompts.introPrompt)
  }

  // Generate chapters
  for (const chapterPrompt of prompts.chapters) {
    console.log(`[Content Generator] Processing ${chapterPrompt.chapterTitle}`)

    // Generate chapter introduction
    const chapterIntro = await generateChapterIntroduction(chapterPrompt.chapterIntro)

    // Generate subheadings
    const subheadings = await Promise.all(
      chapterPrompt.subheadings.map(async (subheading) => {
        const subheadingContent = await generateSubheadingContent(
          subheading.prompt,
          subheading.title
        )
        return {
          title: subheading.title,
          content: subheadingContent
        }
      })
    )

    const chapterNumber = parseInt(chapterPrompt.chapterTitle.match(/\d+/)?.[0] || '1')

    content.chapters.push({
      number: chapterNumber,
      title: chapterPrompt.chapterTitle,
      introduction: chapterIntro,
      subheadings
    })
  }

  return content
}

/**
 * Generate chapter content for fiction books
 */
export async function generateFictionChapterContent(
  chapterPrompt: string,
  conversationHistory: Array<{ role: string; content: string }> = []
): Promise<{ content: string; updatedHistory: Array<{ role: string; content: string }> }> {
  if (!chapterPrompt || !chapterPrompt.trim()) {
    return { content: '', updatedHistory: conversationHistory }
  }

  console.log('[Content Generator] Generating fiction chapter content...')

  // Build messages array with conversation history
  const messages = [
    ...conversationHistory,
    {
      role: 'user',
      content: chapterPrompt
    }
  ]

  const chapterContent = await chatCompletion(
    messages,
    { temperature: 0.7, max_tokens: 8000 }
  )

  const formattedContent = formatText(chapterContent)

  // Update conversation history
  const updatedHistory = [
    ...conversationHistory,
    { role: 'user', content: chapterPrompt },
    { role: 'assistant', content: formattedContent }
  ]

  return {
    content: formattedContent,
    updatedHistory
  }
}

/**
 * Generate prologue content for fiction books
 */
export async function generatePrologueContent(prologuePrompt: string): Promise<string> {
  if (!prologuePrompt || !prologuePrompt.trim()) {
    return ''
  }

  console.log('[Content Generator] Generating prologue...')
  const content = await chatCompletion(
    [{ role: 'user', content: prologuePrompt }],
    { temperature: 0.7, max_tokens: 4000 }
  )

  return formatText(content)
}

/**
 * Generate epilogue content for fiction books
 */
export async function generateEpilogueContent(epiloguePrompt: string): Promise<string> {
  if (!epiloguePrompt || !epiloguePrompt.trim()) {
    return ''
  }

  console.log('[Content Generator] Generating epilogue...')
  const content = await chatCompletion(
    [{ role: 'user', content: epiloguePrompt }],
    { temperature: 0.7, max_tokens: 4000 }
  )

  return formatText(content)
}

/**
 * Generate full fiction book content from prompts
 */
export async function generateFictionContent(
  prompts: FictionPrompts
): Promise<GeneratedBookContent> {
  console.log(`[Content Generator] Generating fiction book: ${prompts.bookTitle}`)

  const content: GeneratedBookContent = {
    chapters: []
  }

  // Generate prologue
  if (prompts.prologue) {
    content.prologue = await generatePrologueContent(prompts.prologue)
  }

  // Generate chapters with conversation history for continuity
  let conversationHistory: Array<{ role: string; content: string }> = []

  for (const chapter of prompts.chapters) {
    console.log(`[Content Generator] Processing ${chapter.chapter}`)

    const chapterNumber = parseInt(chapter.chapter.match(/\d+/)?.[0] || '1')

    const { content: chapterContent, updatedHistory } = await generateFictionChapterContent(
      chapter.chapterPrompt,
      conversationHistory
    )

    conversationHistory = updatedHistory

    content.chapters.push({
      number: chapterNumber,
      title: chapter.chapter,
      content: chapterContent
    })
  }

  // Generate epilogue
  if (prompts.epilogue) {
    content.epilogue = await generateEpilogueContent(prompts.epilogue)
  }

  return content
}

/**
 * Generate a single chapter for non-fiction (useful for incremental generation)
 */
export async function generateNonFictionChapter(
  chapterPrompt: NonFictionPrompts['chapters'][0]
): Promise<GeneratedBookContent['chapters'][0]> {
  console.log(`[Content Generator] Generating chapter: ${chapterPrompt.chapterTitle}`)

  // Generate chapter introduction
  const chapterIntro = await generateChapterIntroduction(chapterPrompt.chapterIntro)

  // Generate subheadings
  const subheadings = await Promise.all(
    chapterPrompt.subheadings.map(async (subheading) => {
      const subheadingContent = await generateSubheadingContent(
        subheading.prompt,
        subheading.title
      )
      return {
        title: subheading.title,
        content: subheadingContent
      }
    })
  )

  const chapterNumber = parseInt(chapterPrompt.chapterTitle.match(/\d+/)?.[0] || '1')

  return {
    number: chapterNumber,
    title: chapterPrompt.chapterTitle,
    introduction: chapterIntro,
    subheadings
  }
}

/**
 * Generate a single chapter for fiction (useful for incremental generation)
 */
export async function generateFictionChapter(
  chapterPrompt: string,
  conversationHistory: Array<{ role: string; content: string }> = []
): Promise<{ chapter: GeneratedBookContent['chapters'][0]; updatedHistory: Array<{ role: string; content: string }> }> {
  const { content: chapterContent, updatedHistory } = await generateFictionChapterContent(
    chapterPrompt,
    conversationHistory
  )

  // Extract chapter number from prompt if possible
  const chapterMatch = chapterPrompt.match(/Chapter\s+(\d+):/i)
  const chapterNumber = chapterMatch ? parseInt(chapterMatch[1]) : 1
  const chapterTitle = chapterMatch ? chapterMatch[0].trim() : `Chapter ${chapterNumber}`

  return {
    chapter: {
      number: chapterNumber,
      title: chapterTitle,
      content: chapterContent
    },
    updatedHistory
  }
}

