import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { prompt, aspect_ratio, model, magic_prompt_option, style_type } = body

        if (!prompt) {
            return NextResponse.json(
                { error: 'Prompt is required' },
                { status: 400 }
            )
        }

        const apiKey = process.env.IDEOGRAM_API_KEY
        if (!apiKey) {
            return NextResponse.json(
                { error: 'Ideogram API key not configured' },
                { status: 500 }
            )
        }

        // Call Ideogram API
        const response = await fetch('https://api.ideogram.ai/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Api-Key': apiKey,
            },
            body: JSON.stringify({
                image_request: {
                    prompt,
                    aspect_ratio: aspect_ratio || 'ASPECT_10_16', // Approximate for book cover
                    model: model || 'V_2',
                    magic_prompt_option: magic_prompt_option || 'AUTO',
                    style_type: style_type || 'GENERAL',
                }
            }),
        })

        if (!response.ok) {
            const errorData = await response.json()
            console.error('Ideogram API error:', errorData)
            return NextResponse.json(
                { error: errorData.message || 'Failed to generate image with Ideogram' },
                { status: response.status }
            )
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error) {
        console.error('Error generating image:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
