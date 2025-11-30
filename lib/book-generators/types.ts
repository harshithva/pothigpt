// Type definitions for book generation

export interface BookGenerationInput {
  bookType: 'fiction' | 'non-fiction'
  audience: 'adult' | 'kids'
  title: string
  // Fiction-specific
  genre?: string
  subGenre?: string
  premiseTheme?: string
  characters?: string
  setting?: string
  toneStyle?: string
  dialogueGuideline?: string
  pacing?: string
  wordsPerChapter?: number
  numChapters?: number
  // Non-fiction-specific
  chapterStructure?: string
  chaptersRequired?: number
}

export interface GeneratedOutline {
  title: string
  description?: string
  genre?: string
  audience?: string
  prologue?: { 
    title: string
    summary: string
    content?: string
  }
  chapters: Array<{
    number: number
    title: string
    heading?: string
    summary?: string
    description?: string
    subheadings?: string[]
    goal?: string
  }>
  epilogue?: { 
    title: string
    summary: string
    content?: string
  }
}

export interface FictionContext {
  plotOutline: string
  characterProfiles: string
  conflictsResolutions: string
  foreshadowingClues: string
  subplots?: string
  chapterGoals?: string[]
}

export interface ChapterPrompt {
  chapterNumber: number
  chapterTitle: string
  chapterIntroPrompt?: string
  subheadingPrompts?: Array<{
    subheading: string
    prompt: string
  }>
  chapterPrompt?: string // For fiction
}

export interface GeneratedBookContent {
  introduction?: string
  prologue?: string
  chapters: Array<{
    number: number
    title: string
    introduction?: string
    subheadings?: Array<{
      title: string
      content: string
    }>
    content?: string // For fiction
  }>
  epilogue?: string
}

export interface NonFictionPrompts {
  bookTitle: string
  introPrompt: string
  chapters: Array<{
    chapterTitle: string
    chapterIntro: string
    subheadings: Array<{
      title: string
      prompt: string
    }>
  }>
  genre: string
  targetAudience: string
}

export interface FictionPrompts {
  bookTitle: string
  authorName?: string
  prologue: string
  chapters: Array<{
    chapter: string
    chapterPrompt: string
  }>
  epilogue?: string
  bookDescription?: string
  keywords?: string
}


