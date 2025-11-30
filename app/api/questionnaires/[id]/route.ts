import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Hardcoded questionnaires as fallback (temporary workaround for database issues)
const FALLBACK_QUESTIONNAIRES: Record<string, any> = {
  'how-to-guide': {
    id: 'how-to-guide',
    title: 'How-To Guide eBook',
    description: 'Create a step-by-step instructional guide',
    questions: [
      {
        id: 'q1',
        question: 'What is the main topic of your how-to guide?',
        type: 'text',
        required: true
      },
      {
        id: 'q2',
        question: 'Brief description of what you want to teach',
        type: 'textarea',
        required: true
      },
      {
        id: 'q3',
        question: 'Who is the target audience?',
        type: 'multiple-choice',
        options: ['Beginners', 'Intermediate', 'Advanced', 'All Levels'],
        required: true
      },
      {
        id: 'q4',
        question: 'How many chapters do you want?',
        type: 'multiple-choice',
        options: ['3-5 Chapters', '6-8 Chapters', '9-12 Chapters', '12+ Chapters'],
        required: true
      },
      {
        id: 'q5',
        question: 'Preferred writing style',
        type: 'multiple-choice',
        options: ['Conversational & Friendly', 'Professional & Formal', 'Simple & Direct', 'Detailed & Technical'],
        required: true
      },
      {
        id: 'q6',
        question: 'Include practical examples?',
        type: 'multiple-choice',
        options: ['Yes, many examples', 'Yes, a few examples', 'Minimal examples', 'Theory focused'],
        required: true
      }
    ],
    isPublished: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  'business': {
    id: 'business',
    title: 'Business Strategy eBook',
    description: 'Share your business insights and strategies',
    questions: [
      {
        id: 'q1',
        question: 'What is the main topic of your business book?',
        type: 'text',
        required: true
      },
      {
        id: 'q2',
        question: 'Brief description of the business strategies you want to cover',
        type: 'textarea',
        required: true
      },
      {
        id: 'q3',
        question: 'Target audience',
        type: 'multiple-choice',
        options: ['Entrepreneurs', 'Small Business Owners', 'Corporate Leaders', 'Students & Beginners'],
        required: true
      },
      {
        id: 'q4',
        question: 'Industry focus',
        type: 'multiple-choice',
        options: ['Technology', 'Retail & E-commerce', 'Finance & Banking', 'General Business', 'Marketing & Sales', 'Other'],
        required: true
      },
      {
        id: 'q5',
        question: 'Book length preference',
        type: 'multiple-choice',
        options: ['Short (30-50 pages)', 'Medium (50-100 pages)', 'Long (100-150 pages)', 'Comprehensive (150+ pages)'],
        required: true
      },
      {
        id: 'q6',
        question: 'Include case studies?',
        type: 'multiple-choice',
        options: ['Yes, multiple case studies', 'Yes, 1-2 case studies', 'No case studies', 'Focus on frameworks only'],
        required: true
      }
    ],
    isPublished: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  'recipe': {
    id: 'recipe',
    title: 'Recipe Collection eBook',
    description: 'Compile your favorite recipes into a beautiful cookbook',
    questions: [
      {
        id: 'q1',
        question: 'What is the main theme of your recipe book?',
        type: 'text',
        required: true
      },
      {
        id: 'q2',
        question: 'Brief description of your recipe collection',
        type: 'textarea',
        required: true
      },
      {
        id: 'q3',
        question: 'Type of cuisine',
        type: 'multiple-choice',
        options: ['Indian', 'Italian', 'Chinese', 'Mexican', 'Mediterranean', 'Fusion', 'International Mix'],
        required: true
      },
      {
        id: 'q4',
        question: 'Recipe difficulty level',
        type: 'multiple-choice',
        options: ['Beginner-friendly (Easy)', 'Intermediate', 'Advanced', 'Mixed levels'],
        required: true
      },
      {
        id: 'q5',
        question: 'How many recipes to include?',
        type: 'multiple-choice',
        options: ['10-20 recipes', '20-30 recipes', '30-50 recipes', '50+ recipes'],
        required: true
      },
      {
        id: 'q6',
        question: 'Include nutritional information?',
        type: 'multiple-choice',
        options: ['Yes, detailed nutrition facts', 'Yes, basic info (calories only)', 'No nutritional info', 'Focus on ingredients only'],
        required: true
      }
    ],
    isPublished: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  // Handle both Promise and direct params (Next.js compatibility)
  const params = await Promise.resolve(context.params)
  const questionnaireId = params.id
  
  // Always use fallback questionnaires for now (database issue workaround)
  const fallbackQuestionnaire = FALLBACK_QUESTIONNAIRES[questionnaireId]
  if (fallbackQuestionnaire) {
    return NextResponse.json(fallbackQuestionnaire)
  }

  try {
    // Try to fetch from database as backup
    const questionnaire = await prisma.questionnaire.findUnique({
      where: { id: questionnaireId }
    })

    if (questionnaire) {
      return NextResponse.json(questionnaire)
    }

    return NextResponse.json({ error: 'Questionnaire not found' }, { status: 404 })
  } catch (error) {
    console.error('Error fetching questionnaire:', error)
    return NextResponse.json({ error: 'Questionnaire not found' }, { status: 404 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { title, description, questions, isPublished } = body

    const questionnaire = await prisma.questionnaire.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(questions && { questions }),
        ...(typeof isPublished === 'boolean' && { isPublished }),
      }
    })

    return NextResponse.json(questionnaire)
  } catch (error) {
    console.error('Error updating questionnaire:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    await prisma.questionnaire.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Questionnaire deleted successfully' })
  } catch (error) {
    console.error('Error deleting questionnaire:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

