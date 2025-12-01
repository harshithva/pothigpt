import { Document, Packer, Paragraph, TextRun, PageBreak, AlignmentType, HeadingLevel } from 'docx'
import * as fabric from 'fabric'
import type { GeneratedBookContent } from '@/lib/book-generators/types'

/**
 * Extracts text content and formatting from Fabric.js canvas objects
 */
function extractTextFromCanvas(canvasData: any): Paragraph[] {
  const paragraphs: Paragraph[] = []

  if (!canvasData || !canvasData.objects) {
    return paragraphs
  }

  // Group objects by approximate vertical position to form paragraphs
  const objects = canvasData.objects || []

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
    if (obj.type === 'textbox' || obj.type === 'text' || obj.type === 'i-text') {
      const text = obj.text || ''
      if (!text.trim()) continue

      // Extract formatting properties
      const runs: TextRun[] = []

      // Handle multi-line text
      const lines = text.split('\n')
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        if (line.trim()) {
          runs.push(
            new TextRun({
              text: line,
              bold: obj.fontWeight === 'bold' || obj.fontWeight === 700,
              italics: obj.fontStyle === 'italic',
              size: Math.round((obj.fontSize || 12) * 2), // Convert to half-points (docx uses half-points)
              font: obj.fontFamily || 'Calibri',
              color: obj.fill ? (typeof obj.fill === 'string' ? obj.fill.replace('#', '') : '000000') : '000000',
            })
          )
        }

        // Add line break except for last line
        if (i < lines.length - 1 && line.trim()) {
          runs.push(new TextRun({ text: '\n', break: 1 }))
        }
      }

      if (runs.length > 0) {
        // Determine alignment
        let alignment: typeof AlignmentType[keyof typeof AlignmentType] = AlignmentType.LEFT
        if (obj.textAlign === 'center') {
          alignment = AlignmentType.CENTER
        } else if (obj.textAlign === 'right') {
          alignment = AlignmentType.RIGHT
        } else if (obj.textAlign === 'justify') {
          alignment = AlignmentType.JUSTIFIED
        }

        paragraphs.push(
          new Paragraph({
            children: runs,
            alignment: alignment,
            spacing: {
              after: 200, // 10pt spacing after paragraph
            },
          })
        )
      }
    }
  }

  // If no text was found, add a placeholder
  if (paragraphs.length === 0) {
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

  // Process each page
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i]

    // Add page break before each page (except the first)
    if (i > 0) {
      children.push(
        new Paragraph({
          children: [new PageBreak()],
        })
      )
    }

    // Add page title/name if available
    if (page.name && page.name !== 'Title Page') {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: page.name,
              bold: true,
              size: 40, // 20pt - larger like PDF
              font: 'Calibri',
            }),
          ],
          spacing: {
            before: 200,
            after: 200,
          },
        })
      )
    }

    // Extract and add content from canvas
    if (page.data) {
      const pageParagraphs = extractTextFromCanvas(page.data)
      children.push(...pageParagraphs)
    } else {
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

