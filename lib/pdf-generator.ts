import jsPDF from 'jspdf'

export async function generatePDF(pages: any[], bookTitle: string): Promise<Blob> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'px',
    format: [800, 1000],
  })

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i]
    
    if (i > 0) {
      pdf.addPage()
    }

    // If page has canvas data, render it
    if (page.data) {
      // In a real implementation, you would convert the Fabric.js canvas to image
      // For now, we'll add a placeholder
      pdf.setFontSize(24)
      pdf.text(page.name || `Page ${i + 1}`, 400, 50, { align: 'center' })
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

