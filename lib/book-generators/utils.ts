// Utility functions for book generation

/**
 * Clean text by removing special characters
 */
export function formatText(text: string | null | undefined): string {
  if (!text) return ''
  return text.replace(/[\*#"]/g, '').trim()
}

/**
 * Clean introduction text by removing redundant chapter title mentions
 */
export function cleanIntro(text: string, chapterTitle: string): string {
  const lines = text
    .trim()
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
  
  const cleaned: string[] = []
  const subtitle = chapterTitle.split(':').pop()?.trim().toLowerCase() || ''
  const fullTitle = chapterTitle.trim().toLowerCase()
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase()
    if (
      subtitle && subtitle.length > 0 && lowerLine.includes(subtitle) ||
      fullTitle && lowerLine.includes(fullTitle) ||
      /chapter\s*\d+/i.test(lowerLine)
    ) {
      continue
    }
    cleaned.push(line)
  }
  
  return cleaned.join('\n').trim()
}

/**
 * Clean subsection text by removing redundant subheading mentions
 */
export function cleanSubsection(text: string, subheading: string): string {
  const lines = text
    .trim()
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
  
  const cleaned: string[] = []
  const subName = subheading.trim().toLowerCase()
  
  for (const line of lines) {
    if (line.toLowerCase().includes(subName)) {
      continue
    }
    cleaned.push(line)
  }
  
  return cleaned.join('\n').trim()
}

/**
 * Extract JSON from response text (handles code blocks)
 */
export function cleanJsonString(response: string): string {
  // Try to find JSON in code blocks
  const codeBlockMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim()
  }
  
  // Try to find JSON object directly
  const jsonMatch = response.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    return jsonMatch[0].trim()
  }
  
  return response.trim()
}

/**
 * Parse chapter titles from numbered list
 */
export function parseChapterTitles(response: string): string[] {
  const lines = response.split('\n')
  const titles: string[] = []
  
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    
    // Match patterns like "1. Title" or "Chapter 1: Title"
    const match = trimmed.match(/^(?:\d+\.|chapter\s+\d+:)\s*(.+)$/i)
    if (match) {
      titles.push(match[1].trim())
    } else if (!trimmed.match(/^\d+$/)) {
      // If it doesn't match a pattern but isn't just a number, include it
      titles.push(trimmed)
    }
  }
  
  return titles
}

/**
 * Parse chapter goals from text
 */
export function parseChapterGoals(goalsText: string, numChapters: number): string[] {
  const lines = goalsText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
  
  const goals: string[] = []
  
  for (const line of lines) {
    // Remove numbering and "Chapter X:" prefixes
    const cleaned = line
      .replace(/^[\d\.\)\s]*(chapter\s*\d+:)?/i, '')
      .trim()
    
    if (cleaned) {
      goals.push(cleaned)
    }
  }
  
  // Ensure we have at least numChapters goals
  while (goals.length < numChapters) {
    goals.push('Advance the main plot with engaging narrative.')
  }
  
  return goals.slice(0, numChapters)
}


