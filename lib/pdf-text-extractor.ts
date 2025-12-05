// pdf-parse is a CommonJS module, use require for compatibility
const pdf = require('pdf-parse')

export interface PDFTextData {
  text: string
  numPages: number
  info?: {
    Title?: string
    Author?: string
    Subject?: string
    Creator?: string
  }
}

/**
 * Extracts text content from a PDF buffer
 * @param pdfBuffer - Buffer containing PDF file data
 * @returns Promise with extracted text data
 */
export async function extractTextFromPDF(pdfBuffer: Buffer): Promise<PDFTextData> {
  try {
    const data = await pdf(pdfBuffer, {
      // Parse all pages
      max: 0,
      // Use default PDF.js version
      version: 'default',
    })

    // Check if text was extracted
    if (!data.text || data.text.trim().length === 0) {
      throw new Error('PDF contains no extractable text. It may be image-based or password-protected.')
    }

    return {
      text: data.text,
      numPages: data.numpages,
      info: data.info || {},
    }
  } catch (error: any) {
    // Handle specific error cases
    if (error.message?.includes('password') || error.message?.includes('encrypted')) {
      throw new Error('PDF is password-protected and cannot be processed.')
    }
    
    if (error.message?.includes('Invalid PDF')) {
      throw new Error('Invalid PDF file format.')
    }

    // Re-throw with more context
    throw new Error(`Failed to extract text from PDF: ${error.message || 'Unknown error'}`)
  }
}

/**
 * Validates if a buffer is a valid PDF
 * @param buffer - Buffer to validate
 * @returns boolean indicating if buffer is a PDF
 */
export function isValidPDF(buffer: Buffer): boolean {
  // PDF files start with %PDF- followed by version number
  const pdfHeader = buffer.toString('ascii', 0, 4)
  return pdfHeader === '%PDF'
}

