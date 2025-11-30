/**
 * Ideogram API Integration via Context7 MCP
 * Handles image generation using Ideogram API
 */

export interface IdeogramGenerateRequest {
    prompt: string
    aspectRatio?: string
    model?: string
    magicPromptOption?: string
    styleType?: string
}

export interface IdeogramImageData {
    url: string
    prompt: string
    resolution: string
    seed: number
    style_type: string
    is_image_safe: boolean
}

export interface IdeogramGenerateResponse {
    created: string
    data: IdeogramImageData[]
}

/**
 * Generate an image using Ideogram API via Context7 MCP
 */
export async function generateIdeogramImage(
    request: IdeogramGenerateRequest
): Promise<IdeogramImageData> {
    try {
        const response = await fetch('/api/ideogram/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: request.prompt,
                aspect_ratio: request.aspectRatio || '11:18', // Default to book cover ratio
                model: request.model || 'V_2_TURBO',
                magic_prompt_option: request.magicPromptOption || 'AUTO',
                style_type: request.styleType || 'GENERAL',
            }),
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.message || 'Failed to generate image')
        }

        const data: IdeogramGenerateResponse = await response.json()

        if (!data.data || data.data.length === 0) {
            throw new Error('No image generated')
        }

        return data.data[0]
    } catch (error) {
        console.error('Error generating Ideogram image:', error)
        throw error
    }
}

/**
 * Download an image from a URL and convert to data URL for canvas use
 */
export async function downloadImageAsDataUrl(imageUrl: string): Promise<string> {
    try {
        const response = await fetch(imageUrl)
        const blob = await response.blob()

        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result as string)
            reader.onerror = reject
            reader.readAsDataURL(blob)
        })
    } catch (error) {
        console.error('Error downloading image:', error)
        throw error
    }
}
