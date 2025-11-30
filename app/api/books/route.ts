import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const books = await prisma.book.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        updatedAt: 'desc'
      },
      include: {
        questionnaire: true
      }
    })

    return NextResponse.json(books)
  } catch (error) {
    console.error('Error fetching books:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, questionnaireId, answers, content } = body

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'A book title is required.' }, { status: 400 })
    }

    const defaultContent = {
      pages: [],
      settings: {
        width: 800,
        height: 1000,
        backgroundColor: '#ffffff',
      },
    }

    const data: Prisma.BookCreateInput = {
      title: title.trim(),
      answers: (answers ?? {}) as any,
      content: (content ?? defaultContent) as any,
      user: {
        connect: { id: session.user.id },
      },
      ...(questionnaireId
        ? {
            questionnaire: {
              connect: { id: questionnaireId },
            },
          }
        : {}),
    }

    const book = await prisma.book.create({
      data,
    })

    return NextResponse.json(book, { status: 201 })
  } catch (error) {
    console.error('Error creating book:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

