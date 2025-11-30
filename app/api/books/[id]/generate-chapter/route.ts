import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateChapterContent } from '@/lib/openrouter'
import { generateFictionChapter, generateNonFictionChapter, generateNonFictionPrompts } from '@/lib/book-generators'

export async function POST(
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
    const { chapterNumber } = body

    if (!chapterNumber) {
      return NextResponse.json(
        { error: 'Chapter number is required' },
        { status: 400 }
      )
    }

    // Get the book
    const book = await prisma.book.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    })

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    const content = book.content as any
    
    // Validate book structure
    if (!content?.outline?.chapters) {
      return NextResponse.json(
        { error: 'Book does not have a valid outline' },
        { status: 400 }
      )
    }

    // Find the chapter in the outline
    const chapterInfo = content.outline.chapters.find(
      (ch: any) => ch.number === chapterNumber
    )

    if (!chapterInfo) {
      return NextResponse.json(
        { error: `Chapter ${chapterNumber} not found in outline` },
        { status: 404 }
      )
    }

    // Check if already generated
    if (content.chapterStatus?.[chapterNumber] === 'completed') {
      return NextResponse.json({
        message: 'Chapter already generated',
        chapterNumber,
        content: content.generatedChapters?.[chapterNumber] || ''
      })
    }

    console.log(`[Chapter Generation] Generating Chapter ${chapterNumber}: ${chapterInfo.title}`)

    // Update status to 'generating'
    content.chapterStatus = content.chapterStatus || {}
    content.chapterStatus[chapterNumber] = 'generating'
    await prisma.book.update({
      where: { id },
      data: { content }
    })

    // Determine book type from outline or content
    const bookType = content.bookType || content.outline?.bookType || 'non-fiction'
    const audience = content.audience || content.outline?.audience || 'adult'

    let chapterContent: string
    let chapterData: any = {}

    if (bookType === 'fiction') {
      // Use fiction content generator
      const chapterPrompt = content.prompts?.chapters?.find(
        (ch: any) => ch.chapter?.includes(`Chapter ${chapterNumber}:`)
      )?.chapterPrompt

      if (!chapterPrompt && content.prompts) {
        // Try to find by index
        const chapterIndex = chapterNumber - 1
        const chapter = content.prompts.chapters?.[chapterIndex]
        if (chapter?.chapterPrompt) {
          const { chapter: generatedChapter, updatedHistory } = await generateFictionChapter(
            chapter.chapterPrompt,
            content.conversationHistory || []
          )
          chapterContent = generatedChapter.content || ''
          content.conversationHistory = updatedHistory
        } else {
          // Fallback to old method
          const result = await generateChapterContent(
            chapterNumber,
            chapterInfo.title,
            content.outline.title,
            content.answers || {},
            content.conversationHistory || []
          )
          chapterContent = result.content
          content.conversationHistory = result.updatedHistory
        }
      } else if (chapterPrompt) {
        const { chapter: generatedChapter, updatedHistory } = await generateFictionChapter(
          chapterPrompt,
          content.conversationHistory || []
        )
        chapterContent = generatedChapter.content || ''
        content.conversationHistory = updatedHistory
      } else {
        // Fallback to old method
        const result = await generateChapterContent(
          chapterNumber,
          chapterInfo.title,
          content.outline.title,
          content.answers || {},
          content.conversationHistory || []
        )
        chapterContent = result.content
        content.conversationHistory = result.updatedHistory
      }
    } else {
      // Use non-fiction content generator
      // Check if we have prompts stored
      if (content.prompts && content.prompts.chapters) {
        const chapterPrompt = content.prompts.chapters.find(
          (ch: any) => ch.chapterTitle?.includes(`Chapter ${chapterNumber}:`)
        )

        if (chapterPrompt) {
          const generatedChapter = await generateNonFictionChapter(chapterPrompt)
          chapterContent = [
            generatedChapter.introduction,
            ...(generatedChapter.subheadings || []).map(sh => `## ${sh.title}\n\n${sh.content}`)
          ].filter(Boolean).join('\n\n')
          chapterData = {
            introduction: generatedChapter.introduction,
            subheadings: generatedChapter.subheadings
          }
        } else {
          // Fallback to old method
          const result = await generateChapterContent(
            chapterNumber,
            chapterInfo.title,
            content.outline.title,
            content.answers || {},
            content.conversationHistory || []
          )
          chapterContent = result.content
          content.conversationHistory = result.updatedHistory
        }
      } else {
        // Fallback to old method
        const result = await generateChapterContent(
          chapterNumber,
          chapterInfo.title,
          content.outline.title,
          content.answers || {},
          content.conversationHistory || []
        )
        chapterContent = result.content
        content.conversationHistory = result.updatedHistory
      }
    }

    // Update book with generated chapter
    content.generatedChapters = content.generatedChapters || {}
    content.generatedChapters[chapterNumber] = chapterContent
    content.chapterStatus[chapterNumber] = 'completed'
    if (Object.keys(chapterData).length > 0) {
      content.generatedChapterData = content.generatedChapterData || {}
      content.generatedChapterData[chapterNumber] = chapterData
    }

    await prisma.book.update({
      where: { id },
      data: { content }
    })

    console.log(`[Chapter Generation] Completed Chapter ${chapterNumber}`)

    return NextResponse.json({
      success: true,
      chapterNumber,
      title: chapterInfo.title,
      content: chapterContent,
      data: chapterData,
      status: 'completed'
    })

  } catch (error) {
    console.error('[Chapter Generation] Error:', error)
    
    // Try to update status to 'error' if we have the book ID
    try {
      const { id } = await params
      const { chapterNumber } = await request.json()
      
      if (id && chapterNumber) {
        const book = await prisma.book.findUnique({ where: { id } })
        if (book) {
          const content = book.content as any
          if (content.chapterStatus) {
            content.chapterStatus[chapterNumber] = 'error'
            await prisma.book.update({
              where: { id },
              data: { content }
            })
          }
        }
      }
    } catch (updateError) {
      console.error('[Chapter Generation] Failed to update error status:', updateError)
    }

    return NextResponse.json(
      { error: 'Failed to generate chapter. Please try again.' },
      { status: 500 }
    )
  }
}

