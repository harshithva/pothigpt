import { User, Book, Questionnaire, BookStatus, AudiobookStatus } from '@prisma/client'

export type { User, Book, Questionnaire, BookStatus, AudiobookStatus }

export interface Question {
  id: string
  type: 'text' | 'textarea' | 'multiple-choice' | 'rating'
  question: string
  options?: string[]
  required: boolean
}

export interface BookWithRelations extends Book {
  user: User
  questionnaire: Questionnaire | null
}

export interface QuestionnaireWithBooks extends Questionnaire {
  books: Book[]
}

export interface CanvasPage {
  id: string
  name: string
  data: any // Fabric.js JSON
}

export interface BookContent {
  pages: CanvasPage[]
  settings: {
    width: number
    height: number
    backgroundColor: string
  }
}

export interface SimplifiedBookInput {
  bookType: 'fiction' | 'non-fiction'
  audience: 'adult' | 'kids'
  bookTitle: string
  chapterCount: number
}

export interface ChapterStructure {
  number: number
  heading: string
  subheadings: string[]
}

// Re-export book generator types
export type {
  BookGenerationInput,
  GeneratedOutline,
  FictionContext,
  ChapterPrompt,
  GeneratedBookContent,
  NonFictionPrompts,
  FictionPrompts
} from '@/lib/book-generators/types'

