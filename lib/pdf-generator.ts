import jsPDF from 'jspdf'
import * as fabric from 'fabric'

// A4 dimensions in pixels (at 96 DPI)
const A4_WIDTH = 595
const A4_HEIGHT = 842

/**
 * Converts Fabric.js canvas JSON to an image data URL
 */
async function canvasToImage(canvasData: any): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Create a temporary canvas element
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = A4_WIDTH
      tempCanvas.height = A4_HEIGHT

      // Create a Fabric.js canvas from the temporary element
      const fabricCanvas = new fabric.Canvas(tempCanvas, {
        width: A4_WIDTH,
        height: A4_HEIGHT,
        backgroundColor: '#ffffff',
      })

      // Load the canvas data (loadFromJSON now returns a Promise)
      fabricCanvas.loadFromJSON(canvasData)
        .then(() => {
          fabricCanvas.renderAll()

          // Small delay to ensure canvas is fully rendered
          setTimeout(() => {
            try {
              // Convert to image with high resolution
              const dataURL = fabricCanvas.toDataURL({
                format: 'png',
                quality: 1.0,
                multiplier: 3, // 3x resolution for sharper output
              })

              // Clean up
              fabricCanvas.dispose()

              resolve(dataURL)
            } catch (error) {
              fabricCanvas.dispose()
              reject(error)
            }
          }, 100)
        })
        .catch((error: any) => {
          fabricCanvas.dispose()
          reject(error)
        })
    } catch (error) {
      reject(error)
    }
  })
}

export async function generatePDF(pages: any[], bookTitle: string): Promise<Blob> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'px',
    format: [A4_WIDTH, A4_HEIGHT],
  })

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i]

    if (i > 0) {
      pdf.addPage()
    }

    // If page has canvas data, render it as an image
    if (page.data) {
      try {
        // Convert canvas JSON to image
        const imageDataUrl = await canvasToImage(page.data)

        // Add image to PDF (full page) with high quality compression
        pdf.addImage(imageDataUrl, 'PNG', 0, 0, A4_WIDTH, A4_HEIGHT, undefined, 'SLOW')
      } catch (error) {
        console.error(`Error rendering page ${i + 1}:`, error)
        // Fallback: Add page name as text
        pdf.setFontSize(24)
        pdf.text(page.name || `Page ${i + 1}`, A4_WIDTH / 2, A4_HEIGHT / 2, { align: 'center' })
      }
    } else {
      // No data, add placeholder
      pdf.setFontSize(24)
      pdf.text(page.name || `Page ${i + 1}`, A4_WIDTH / 2, A4_HEIGHT / 2, { align: 'center' })
    }
  }

  // Add metadata
  pdf.setProperties({
    title: bookTitle,
    subject: 'Generated eBook',
    author: 'PothiGPT',
    keywords: 'ebook, generated',
    creator: 'PothiGPT',
  })

  return pdf.output('blob')
}

export function downloadPDF(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

