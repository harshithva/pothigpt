import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateBookContent } from '@/lib/openrouter'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { answers, questionnaireTitle } = body

    if (!answers || !questionnaireTitle) {
      return NextResponse.json(
        { error: 'Answers and questionnaire title are required' },
        { status: 400 }
      )
    }

    const generatedContent = await generateBookContent(answers, questionnaireTitle)

    return NextResponse.json(generatedContent)
  } catch (error) {
    console.error('Error generating content:', error)
    return NextResponse.json(
      { error: 'Failed to generate content. Please try again.' },
      { status: 500 }
    )
  }
}

