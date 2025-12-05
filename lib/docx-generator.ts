import { Document, Packer, Paragraph, TextRun, PageBreak, AlignmentType, HeadingLevel } from 'docx'
import * as fabric from 'fabric'
import type { GeneratedBookContent } from '@/lib/book-generators/types'

/**
 * Extracts text content and formatting from Fabric.js canvas objects
 */
function extractTextFromCanvas(canvasData: any): Paragraph[] {
  const paragraphs: Paragraph[] = []

  // Handle different data formats
  let parsedData = canvasData
  
  // Check if data is a string (needs JSON.parse)
  if (typeof canvasData === 'string') {
    try {
      parsedData = JSON.parse(canvasData)
    } catch (e) {
      console.warn('[DOCX] Failed to parse canvas data as JSON:', e)
      return paragraphs
    }
  }

  if (!parsedData) {
    console.warn('[DOCX] No canvas data provided')
    return paragraphs
  }

  // Extract objects from different possible locations in Fabric.js JSON structure
  let objects: any[] = []
  
  if (Array.isArray(parsedData)) {
    // If data is directly an array of objects
    objects = parsedData
  } else if (parsedData.objects && Array.isArray(parsedData.objects)) {
    // Standard Fabric.js structure: { objects: [...] }
    objects = parsedData.objects
  } else if (parsedData.canvas && parsedData.canvas.objects) {
    // Nested structure: { canvas: { objects: [...] } }
    objects = parsedData.canvas.objects
  } else {
    console.warn('[DOCX] Could not find objects array in canvas data:', Object.keys(parsedData))
    return paragraphs
  }

  if (objects.length === 0) {
    console.warn('[DOCX] No objects found in canvas data')
    console.log('[DOCX] Canvas data structure:', JSON.stringify(parsedData, null, 2).substring(0, 500))
    return paragraphs
  }

  console.log(`[DOCX] Found ${objects.length} objects in canvas data`)
  console.log('[DOCX] Object types:', objects.map((o: any) => o.type || 'unknown').join(', '))

  // Helper function to extract text from an object (handles different Fabric.js text types)
  const extractTextFromObject = (obj: any): string => {
    // Try to extract text from any object that might have text
    // First, check for direct text property (most common)
    if (obj.text && typeof obj.text === 'string' && obj.text.trim()) {
      return obj.text
    }
    
    // Handle IText with char array
    if (obj.chars && Array.isArray(obj.chars)) {
      const charText = obj.chars.map((char: any) => {
        if (typeof char === 'string') return char
        if (char && typeof char === 'object') {
          return char.char || char.text || ''
        }
        return ''
      }).join('')
      if (charText.trim()) return charText
    }
    
    // Handle textLines array
    if (obj.textLines && Array.isArray(obj.textLines)) {
      const linesText = obj.textLines.join('\n')
      if (linesText.trim()) return linesText
    }
    
    // Handle different text object types more broadly
    if (obj.type === 'textbox' || obj.type === 'text' || obj.type === 'i-text' || obj.type === 'IText' || obj.type === 'textbox' || obj.type?.toLowerCase().includes('text')) {
      // Try all possible text properties
      if (obj.text) return String(obj.text)
      if (obj.content) return String(obj.content)
      if (obj.value) return String(obj.value)
    }
    
    // Handle grouped objects
    if (obj.type === 'group' && obj.objects && Array.isArray(obj.objects)) {
      const groupText = obj.objects.map(extractTextFromObject).filter(Boolean).join(' ')
      if (groupText.trim()) return groupText
    }
    
    return ''
  }

  // Helper function to convert color to hex (without #)
  const colorToHex = (color: any): string => {
    if (!color) return '000000'
    
    if (typeof color === 'string') {
      // Remove # if present
      if (color.startsWith('#')) {
        return color.substring(1)
      }
      // Handle rgb(r, g, b) format
      if (color.startsWith('rgb')) {
        const match = color.match(/\d+/g)
        if (match && match.length >= 3) {
          const r = parseInt(match[0]).toString(16).padStart(2, '0')
          const g = parseInt(match[1]).toString(16).padStart(2, '0')
          const b = parseInt(match[2]).toString(16).padStart(2, '0')
          return r + g + b
        }
      }
      // Assume it's already hex without #
      return color.length === 6 ? color : '000000'
    }
    
    return '000000'
  }

  // Sort objects by vertical position first, then horizontal for proper reading order
  const sortedObjects = [...objects].sort((a: any, b: any) => {
    const topA = a.top || 0
    const topB = b.top || 0
    const leftA = a.left || 0
    const leftB = b.left || 0

    // If objects are on roughly the same line (within 20px), sort by horizontal position
    if (Math.abs(topA - topB) < 20) {
      return leftA - leftB
    }
    return topA - topB
  })

  // Process each text object
  for (const obj of sortedObjects) {
    // Skip only definitely non-text objects
    if (obj.type === 'rect' || obj.type === 'circle' || obj.type === 'image' || obj.type === 'path' || obj.type === 'line') {
      continue
    }
    
    // Log first few objects for debugging
    if (sortedObjects.indexOf(obj) < 5) {
      console.log(`[DOCX] Processing object ${sortedObjects.indexOf(obj) + 1}: type=${obj.type}, hasText=${!!obj.text}, hasChars=${!!obj.chars}, hasTextLines=${!!obj.textLines}, keys=${Object.keys(obj).join(', ')}`)
    }
    
    // Skip page numbers (very small font at very bottom) and other metadata
    if (obj.fontSize && obj.fontSize <= 12 && obj.top && obj.top > 800) {
      // Likely a page number
      continue
    }
    
    // Skip objects that are clearly just page metadata (like "Page X of Y")
    if (obj.text && typeof obj.text === 'string') {
      const textLower = obj.text.toLowerCase().trim()
      if (textLower.match(/^(page\s*\d+|p\.\s*\d+|\d+)$/) || (textLower.includes('page') && textLower.match(/\d+/))) {
        // Likely a page number or page indicator
        continue
      }
    }

    const text = extractTextFromObject(obj)
    
    if (text && text.trim() && sortedObjects.indexOf(obj) < 5) {
      console.log(`[DOCX] Extracted text from ${obj.type}: "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"`)
    }
    
    if (!text || !text.trim()) {
      // Don't log warning for every object, only if we have very few objects total
      if (sortedObjects.length < 10) {
        console.warn(`[DOCX] No text extracted from object type ${obj.type}`)
      }
      continue
    }

    // Extract formatting properties
    const runs: TextRun[] = []

    // Handle multi-line text
    const lines = text.split('\n')
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (line.trim()) {
        const fontSize = obj.fontSize || 12
        const fontWeight = obj.fontWeight || 'normal'
        const fontStyle = obj.fontStyle || 'normal'
        const fontFamily = obj.fontFamily || 'Calibri'
        const fill = obj.fill || '#000000'
        
        runs.push(
          new TextRun({
            text: line,
            bold: fontWeight === 'bold' || fontWeight === 700 || fontWeight === '700',
            italics: fontStyle === 'italic',
            size: Math.round(fontSize * 2), // Convert to half-points (docx uses half-points)
            font: fontFamily,
            color: colorToHex(fill),
          })
        )
      }

      // Add line break except for last line
      if (i < lines.length - 1 && line.trim()) {
        runs.push(new TextRun({ text: '\n', break: 1 }))
      }
    }

    if (runs.length > 0) {
      // Default to left alignment (only use justify/center/right if explicitly set)
      let alignment: typeof AlignmentType[keyof typeof AlignmentType] = AlignmentType.LEFT
      
      // Only apply non-left alignment if explicitly set and not justify
      // For DOCX generation, we default to left for better readability
      if (obj.textAlign === 'center') {
        alignment = AlignmentType.CENTER
      } else if (obj.textAlign === 'right') {
        alignment = AlignmentType.RIGHT
      } else if (obj.textAlign === 'justify' && obj.textAlign !== undefined) {
        // Only use justify if explicitly set, otherwise default to left
        alignment = AlignmentType.JUSTIFIED
      }
      // Default is already LEFT, so no else needed

      // Determine spacing based on font size (headings get more space)
      const fontSize = obj.fontSize || 12
      const isHeading = fontSize >= 24 || (obj.fontWeight && (obj.fontWeight === 'bold' || obj.fontWeight === 700))
      
      paragraphs.push(
        new Paragraph({
          children: runs,
          alignment: alignment,
          spacing: {
            before: isHeading ? 240 : 0, // 12pt before headings
            after: isHeading ? 240 : 120, // 12pt after headings, 6pt after body text
          },
        })
      )
    }
  }

  // If no text was found, add a placeholder to prevent completely blank pages
  if (paragraphs.length === 0) {
    console.warn('[DOCX] No text extracted from canvas, adding placeholder')
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: ' ',
          }),
        ],
      })
    )
  }

  return paragraphs
}

/**
 * Generates a DOCX document from book pages
 * If structured content is available, uses the formatted generator
 */
export async function generateDOCX(pages: any[], bookTitle: string, content?: GeneratedBookContent, authorName?: string): Promise<Blob> {
  // If structured content is available, use the formatted generator
  if (content && content.chapters && content.chapters.length > 0) {
    return await generateDOCXFromContent(content, bookTitle, authorName)
  }

  // Otherwise, use canvas-based extraction (existing behavior)
  const children: Paragraph[] = []

  // Only add title page if it's not already in the pages
  const hasTitlePage = pages.some(p => p.name && (p.name.toLowerCase().includes('title') || p.name === 'Title Page'))
  
  if (!hasTitlePage) {
    // Add title page
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: bookTitle,
            bold: true,
            size: 56, // 28pt - larger like PDF
            font: 'Calibri',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: {
          after: 400,
        },
      })
    )
    
    // Add page break after title
    children.push(
      new Paragraph({
        children: [new PageBreak()],
      })
    )
  }

  // Process each page
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i]

    if (!page) {
      console.warn(`[DOCX] Page ${i} is undefined, skipping`)
      continue
    }

    // Skip title page, author page, and copyright pages - they're already handled
    const pageName = page.name?.toLowerCase() || ''
    if (pageName.includes('title') || pageName.includes('author') || pageName.includes('copyright')) {
      console.log(`[DOCX] Skipping front matter page: ${page.name}`)
      continue
    }

    // Add page break before each page (except the first)
    if (i > 0 && children.length > 0) {
      children.push(
        new Paragraph({
          children: [new PageBreak()],
        })
      )
    }

    // Don't add page names - they're just metadata, not content
    // Skip adding page titles to avoid cluttering the document

    // Extract and add content from canvas
    if (page.data) {
      console.log(`[DOCX] Processing page ${i + 1}: ${page.name || 'Unnamed'}`)
      const pageParagraphs = extractTextFromCanvas(page.data)
      
      if (pageParagraphs.length > 0) {
        children.push(...pageParagraphs)
        console.log(`[DOCX] Extracted ${pageParagraphs.length} paragraphs from page ${i + 1}`)
      } else {
        console.warn(`[DOCX] No paragraphs extracted from page ${i + 1}, adding placeholder`)
        // Empty page placeholder
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: ' ',
              }),
            ],
          })
        )
      }
    } else {
      console.warn(`[DOCX] Page ${i + 1} has no data, adding placeholder`)
      // Empty page placeholder
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: ' ',
            }),
          ],
        })
      )
    }
  }

  // Create the document with proper margins and default font
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Calibri',
            size: 22, // 11pt default - readable body text
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              width: 12240, // A4 width in twips (20th of a point)
              height: 15840, // A4 height in twips
            },
            margin: {
              top: 1440,    // 1 inch = 1440 twips
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: children,
      },
    ],
  })

  // Generate blob
  const blob = await Packer.toBlob(doc)
  return blob
}

/**
 * Generates a DOCX document from structured book content (matching Python implementation)
 * Formats content with proper headings, spacing, and typography like the PDF example
 */
export async function generateDOCXFromContent(
  content: GeneratedBookContent,
  bookTitle: string,
  authorName: string = 'AI Book Generator'
): Promise<Blob> {
  const children: Paragraph[] = []

  // Title Page - centered, large font (matching PDF)
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: bookTitle,
          bold: true,
          size: 56, // 28pt - larger title like PDF
          font: 'Calibri',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: {
        after: 400,
      },
    })
  )

  // Author name - centered, medium font
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `By ${authorName}`,
          size: 32, // 16pt - increased
          font: 'Calibri',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: {
        after: 600,
      },
    })
  )

  // Page break after title page
  children.push(
    new Paragraph({
      children: [new PageBreak()],
    })
  )

  // Introduction (if present)
  if (content.introduction) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Introduction',
            bold: true,
            size: 40, // 20pt for heading - larger like PDF
            font: 'Calibri',
          }),
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: {
          before: 400,
          after: 400,
        },
      })
    )

    // Split introduction into paragraphs
    const introParagraphs = content.introduction
      .split('\n\n')
      .filter(p => p.trim())
      .map(text => 
        new Paragraph({
          children: [
            new TextRun({
              text: text.trim(),
              size: 22, // 11pt body text - readable size
              font: 'Calibri',
            }),
          ],
          spacing: {
            after: 240, // 12pt spacing between paragraphs
          },
        })
      )

    children.push(...introParagraphs)
    children.push(
      new Paragraph({
        children: [new PageBreak()],
      })
    )
  }

  // Process chapters
  for (const chapter of content.chapters) {
    // Chapter heading - Level 1, centered (matching PDF style - larger)
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: chapter.title,
            bold: true,
            size: 40, // 20pt for heading - larger like PDF
            font: 'Calibri',
          }),
        ],
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: {
          before: 400,
          after: 400,
        },
      })
    )

    // Chapter introduction (if present)
    if (chapter.introduction) {
      const introParagraphs = chapter.introduction
        .split('\n\n')
        .filter(p => p.trim())
        .map(text =>
          new Paragraph({
            children: [
              new TextRun({
                text: text.trim(),
                size: 22, // 11pt body text - readable
                font: 'Calibri',
              }),
            ],
            spacing: {
              after: 240,
            },
          })
        )

      children.push(...introParagraphs)
      children.push(
        new Paragraph({
          children: [new TextRun({ text: '' })],
          spacing: { after: 240 },
        })
      )
    }

    // Process subheadings (for non-fiction)
    if (chapter.subheadings && chapter.subheadings.length > 0) {
      for (const subheading of chapter.subheadings) {
        // Subheading - Level 2 (matching PDF ## style - larger)
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: subheading.title,
                bold: true,
                size: 32, // 16pt for subheading - larger like PDF
                font: 'Calibri',
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: {
              before: 360, // 18pt before subheading
              after: 240,  // 12pt after subheading
            },
          })
        )

        // Subheading content - split into paragraphs
        const contentParagraphs = subheading.content
          .split('\n\n')
          .filter(p => p.trim())
          .map(text =>
            new Paragraph({
              children: [
                new TextRun({
                  text: text.trim(),
                  size: 22, // 11pt body text - readable
                  font: 'Calibri',
                }),
              ],
              spacing: {
                after: 240, // 12pt spacing between paragraphs
              },
            })
          )

        children.push(...contentParagraphs)
        children.push(
          new Paragraph({
            children: [new TextRun({ text: '' })],
            spacing: { after: 240 },
          })
        )
      }
    }

    // Process chapter content (for fiction)
    if (chapter.content) {
      const contentParagraphs = chapter.content
        .split('\n\n')
        .filter(p => p.trim())
        .map(text =>
          new Paragraph({
            children: [
              new TextRun({
                text: text.trim(),
                size: 22, // 11pt body text - readable
                font: 'Calibri',
              }),
            ],
            spacing: {
              after: 240,
            },
          })
        )

      children.push(...contentParagraphs)
    }

    // Page break after each chapter
    children.push(
      new Paragraph({
        children: [new PageBreak()],
      })
    )
  }

  // Epilogue (if present)
  if (content.epilogue) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Epilogue',
            bold: true,
            size: 40, // 20pt for heading - larger like PDF
            font: 'Calibri',
          }),
        ],
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: {
          before: 400,
          after: 400,
        },
      })
    )

    const epilogueParagraphs = content.epilogue
      .split('\n\n')
      .filter(p => p.trim())
      .map(text =>
        new Paragraph({
          children: [
            new TextRun({
              text: text.trim(),
              size: 22, // 11pt body text - readable
              font: 'Calibri',
            }),
          ],
          spacing: {
            after: 240,
          },
        })
      )

    children.push(...epilogueParagraphs)
  }

  // Create the document with proper margins and formatting
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Calibri',
            size: 22, // 11pt default - readable body text
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              width: 12240, // A4 width in twips
              height: 15840, // A4 height in twips
            },
            margin: {
              top: 1440,    // 1 inch margins
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: children,
      },
    ],
  })

  // Generate blob
  const blob = await Packer.toBlob(doc)
  return blob
}

/**
 * Downloads a DOCX file
 */
export function downloadDOCX(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.docx') ? filename : `${filename}.docx`
  link.click()
  URL.revokeObjectURL(url)
}

