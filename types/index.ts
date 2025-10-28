import { User, Book, Questionnaire, BookStatus } from '@prisma/client'

export type { User, Book, Questionnaire, BookStatus }

export interface Question {
  id: string
  type: 'text' | 'textarea' | 'multiple-choice' | 'rating'
  question: string
  options?: string[]
  required: boolean
}

export interface BookWithRelations extends Book {
  user: User
  questionnaire: Questionnaire
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

