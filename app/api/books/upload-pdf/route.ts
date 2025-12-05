import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { extractTextFromPDF, isValidPDF } from '@/lib/pdf-text-extractor'
import fs from 'fs/promises'
import path from 'path'

const MAX_FILE_SIZE = parseInt(process.env.MAX_PDF_SIZE || '10485760', 10) // Default 10MB

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const title = formData.get('title') as string | null

    // Validate file
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'File must be a PDF' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    // Get book title
    const bookTitle = title?.trim() || file.name.replace(/\.pdf$/i, '') || 'Untitled Book'

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Validate PDF format
    if (!isValidPDF(buffer)) {
      return NextResponse.json(
        { error: 'Invalid PDF file format' },
        { status: 400 }
      )
    }

    // Extract text from PDF
    let pdfTextData
    try {
      pdfTextData = await extractTextFromPDF(buffer)
    } catch (error: any) {
      return NextResponse.json(
        { error: `Failed to extract text from PDF: ${error.message}` },
        { status: 400 }
      )
    }

    // Create book record
    const book = await prisma.book.create({
      data: {
        title: bookTitle,
        userId: session.user.id,
        answers: {
          source: 'pdf_upload',
          fileName: file.name,
          fileSize: file.size,
          numPages: pdfTextData.numPages,
        },
        content: {
          pages: [],
          settings: {
            width: 800,
            height: 1000,
            backgroundColor: '#ffffff',
          },
        },
        audiobookStatus: 'PENDING',
      },
    })

    // Store PDF text in a temporary location for audiobook generation
    // We'll extract it again during generation, but this ensures we have the book record
    const tempDir = path.join(process.cwd(), 'tmp', 'pdfs')
    await fs.mkdir(tempDir, { recursive: true })
    const tempPdfPath = path.join(tempDir, `${book.id}.pdf`)
    await fs.writeFile(tempPdfPath, buffer)

    return NextResponse.json(
      {
        book: {
          id: book.id,
          title: book.title,
          numPages: pdfTextData.numPages,
          textLength: pdfTextData.text.length,
        },
        message: 'PDF uploaded successfully. You can now generate the audiobook.',
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error uploading PDF:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

