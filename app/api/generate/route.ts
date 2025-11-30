import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateChapterOutline } from '@/lib/openrouter'
import type { SimplifiedBookInput } from '@/types'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      bookType,
      audience,
      bookTitle,
      chapterCount,
    } = body as Partial<SimplifiedBookInput>

    const validBookTypes: Array<SimplifiedBookInput['bookType']> = ['fiction', 'non-fiction']
    const validAudiences: Array<SimplifiedBookInput['audience']> = ['adult', 'kids']

    if (!bookTitle || typeof bookTitle !== 'string') {
      return NextResponse.json(
        { error: 'Book title is required' },
        { status: 400 }
      )
    }

    if (!bookType || !validBookTypes.includes(bookType)) {
      return NextResponse.json(
        { error: 'bookType must be "fiction" or "non-fiction"' },
        { status: 400 }
      )
    }

    if (!audience || !validAudiences.includes(audience)) {
      return NextResponse.json(
        { error: 'audience must be "adult" or "kids"' },
        { status: 400 }
      )
    }

    const parsedChapterCount = typeof chapterCount === 'number' ? chapterCount : Number(chapterCount)
    if (!Number.isFinite(parsedChapterCount)) {
      return NextResponse.json(
        { error: 'chapterCount must be a number between 10 and 15' },
        { status: 400 }
      )
    }

    if (parsedChapterCount < 10 || parsedChapterCount > 15) {
      return NextResponse.json(
        { error: 'chapterCount must be between 10 and 15' },
        { status: 400 }
      )
    }

    // Use the original generateChapterOutline function to maintain the same chapter title generation
    const outline = await generateChapterOutline({
      bookType,
      audience,
      bookTitle: bookTitle.trim(),
      chapterCount: parsedChapterCount,
    })
    
    // Validate the outline
    if (!outline || typeof outline !== 'object') {
      console.error('[Generate API] Invalid outline type:', typeof outline)
      throw new Error('Generated outline is not a valid object')
    }
    
    if (!outline.chapters || !Array.isArray(outline.chapters)) {
      console.error('[Generate API] Missing or invalid chapters in outline:', outline)
      throw new Error('Generated outline does not contain valid chapters array')
    }
    
    console.log('[Generate API] Returning outline with', outline.chapters.length, 'chapters')
    return NextResponse.json(outline)
  } catch (error) {
    console.error('Error generating content:', error)
    return NextResponse.json(
      { error: 'Failed to generate content. Please try again.' },
      { status: 500 }
    )
  }
}

