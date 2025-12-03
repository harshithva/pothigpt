import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    console.log('[SIGNUP] Starting signup process...')
    const body = await request.json()
    const { name, email, password } = body

    console.log('[SIGNUP] Received data:', { name: name ? 'provided' : 'missing', email: email ? 'provided' : 'missing', hasPassword: !!password })

    if (!email || !password) {
      console.error('[SIGNUP] Missing required fields:', { email: !!email, password: !!password })
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Normalize email (lowercase and trim)
    const normalizedEmail = email.toLowerCase().trim()
    console.log('[SIGNUP] Normalized email:', normalizedEmail)

    // Check database connection
    try {
      await prisma.$connect()
      console.log('[SIGNUP] Database connected successfully')
    } catch (dbError) {
      console.error('[SIGNUP] Database connection error:', dbError)
      throw new Error(`Database connection failed: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`)
    }

    // Check if user already exists
    console.log('[SIGNUP] Checking for existing user...')
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    })

    if (existingUser) {
      console.log('[SIGNUP] User already exists:', normalizedEmail)
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 400 }
      )
    }

    console.log('[SIGNUP] User does not exist, proceeding with creation...')

    // Hash password
    console.log('[SIGNUP] Hashing password...')
    const hashedPassword = await bcrypt.hash(password, 12)
    console.log('[SIGNUP] Password hashed successfully')

    // Create user with normalized email
    console.log('[SIGNUP] Creating user in database...')
    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        password: hashedPassword,
      }
    })

    console.log('[SIGNUP] User created successfully:', user.id)

    return NextResponse.json(
      { 
        message: 'User created successfully',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        }
      },
      { status: 201 }
    )
  } catch (error) {
    // Always log full error details for debugging (even in production)
    console.error('[SIGNUP] Error occurred:')
    console.error('[SIGNUP] Error type:', error?.constructor?.name)
    console.error('[SIGNUP] Error message:', error instanceof Error ? error.message : 'Unknown error')
    console.error('[SIGNUP] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    if (error instanceof Error) {
      console.error('[SIGNUP] Full error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause,
      })
    }

    // Check for specific Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
      console.error('[SIGNUP] Prisma error code:', error.code)
    }

    // In development, return detailed error message
    const isDevelopment = process.env.NODE_ENV === 'development'
    const errorMessage = isDevelopment 
      ? (error instanceof Error ? error.message : 'Unknown error occurred')
      : 'Something went wrong. Please try again.'

    return NextResponse.json(
      { 
        error: errorMessage,
        ...(isDevelopment && error instanceof Error && {
          details: {
            name: error.name,
            message: error.message,
          }
        })
      },
      { status: 500 }
    )
  }
}

