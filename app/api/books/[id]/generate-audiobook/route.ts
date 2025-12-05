import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { extractTextFromPDF } from '@/lib/pdf-text-extractor'
import { generateAudiobook } from '@/lib/audiobook-generator'
import fs from 'fs/promises'
import path from 'path'

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

    // Get book
    const book = await prisma.book.findUnique({
      where: { id },
      include: { user: true },
    })

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    // Check ownership
    if (book.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Check if audiobook already exists
    if (book.audiobookStatus === 'COMPLETED' && book.audiobookUrl) {
      return NextResponse.json(
        {
          message: 'Audiobook already exists',
          audiobookUrl: book.audiobookUrl,
        },
        { status: 200 }
      )
    }

    // Update status to PROCESSING
    await prisma.book.update({
      where: { id },
      data: { audiobookStatus: 'PROCESSING' },
    })

    try {
      // Try to get PDF text from stored PDF file
      let text: string
      const tempPdfPath = path.join(process.cwd(), 'tmp', 'pdfs', `${id}.pdf`)

      try {
        // Check if PDF file exists
        await fs.access(tempPdfPath)
        const pdfBuffer = await fs.readFile(tempPdfPath)
        const pdfTextData = await extractTextFromPDF(pdfBuffer)
        text = pdfTextData.text
      } catch (fileError) {
        // If PDF file doesn't exist, try to extract from book content
        // This handles cases where book was created from questionnaire
        const content = book.content as any
        if (content && typeof content === 'object') {
          // Try to extract text from canvas content
          text = extractTextFromCanvasContent(content)
        } else {
          throw new Error('No PDF file found and book content is not available for audiobook generation')
        }
      }

      if (!text || text.trim().length === 0) {
        throw new Error('No text content available for audiobook generation')
      }

      // Get options from request body (optional)
      const body = await request.json().catch(() => ({}))
      const voice = body.voice || process.env.AUDIOBOOK_VOICE || 'alloy'
      const model = body.model || 'tts-1-hd'
      const speed = body.speed || 1.0

      // Generate unique filename
      const filename = `audiobook-${id}-${Date.now()}.mp3`
      const outputPath = path.join(process.cwd(), 'public', 'audiobooks', filename)

      // Ensure audiobooks directory exists
      await fs.mkdir(path.dirname(outputPath), { recursive: true })

      // Generate audiobook
      await generateAudiobook(text, outputPath, {
        voice: voice as any,
        model: model as any,
        speed: speed,
        outputFormat: 'mp3',
      })

      // Get file size
      const stats = await fs.stat(outputPath)
      const fileSize = stats.size

      // Update book with audiobook URL and status
      const audiobookUrl = `/audiobooks/${filename}`
      await prisma.book.update({
        where: { id },
        data: {
          audiobookUrl,
          audiobookStatus: 'COMPLETED',
        },
      })

      return NextResponse.json(
        {
          message: 'Audiobook generated successfully',
          audiobookUrl,
          fileSize,
          duration: 'N/A', // Could be calculated if needed
        },
        { status: 200 }
      )
    } catch (error: any) {
      console.error('Error generating audiobook:', error)

      // Update status to FAILED
      await prisma.book.update({
        where: { id },
        data: { audiobookStatus: 'FAILED' },
      })

      return NextResponse.json(
        {
          error: error.message || 'Failed to generate audiobook',
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error in generate-audiobook endpoint:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Extract text from canvas content (Fabric.js JSON)
 * This is a fallback for books created from questionnaires
 */
function extractTextFromCanvasContent(content: any): string {
  if (!content || typeof content !== 'object') {
    return ''
  }

  const pages = content.pages || []
  const textParts: string[] = []

  for (const page of pages) {
    if (page.objects && Array.isArray(page.objects)) {
      for (const obj of page.objects) {
        if (obj.type === 'text' || obj.type === 'textbox' || obj.type === 'i-text') {
          if (obj.text && typeof obj.text === 'string') {
            textParts.push(obj.text)
          }
        }
      }
    }
  }

  return textParts.join('\n\n')
}

