import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Hardcoded questionnaires as fallback (temporary workaround for database issues)
const FALLBACK_QUESTIONNAIRES = [
  {
    id: 'how-to-guide',
    title: 'How-To Guide eBook',
    description: 'Create a step-by-step instructional guide',
    questionCount: 6,
    isPublished: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'business',
    title: 'Business Strategy eBook',
    description: 'Share your business insights and strategies',
    questionCount: 6,
    isPublished: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'recipe',
    title: 'Recipe Collection eBook',
    description: 'Compile your favorite recipes into a beautiful cookbook',
    questionCount: 6,
    isPublished: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

export async function GET() {
  // Always use fallback questionnaires for now (database issue workaround)
  return NextResponse.json(FALLBACK_QUESTIONNAIRES)
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, questions, isPublished } = body

    const questionnaire = await prisma.questionnaire.create({
      data: {
        title,
        description,
        questions: questions || [],
        isPublished: isPublished || false,
      }
    })

    return NextResponse.json(questionnaire, { status: 201 })
  } catch (error) {
    console.error('Error creating questionnaire:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

