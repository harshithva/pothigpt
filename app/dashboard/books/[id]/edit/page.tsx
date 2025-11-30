'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { CanvasEditor } from '@/components/editor/CanvasEditor'
import { Book } from '@/types'
import { Flex, Text, Button, Box, Badge, Heading } from '@radix-ui/themes'
import { ArrowLeftIcon, CheckCircledIcon, DownloadIcon } from '@radix-ui/react-icons'
import { generatePDF, downloadPDF } from '@/lib/pdf-generator'
import { generateDOCX, downloadDOCX } from '@/lib/docx-generator'

export default function EditBookPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session } = useSession()
  const bookId = params.id as string
  
  const [book, setBook] = useState<Book | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generatingChapters, setGeneratingChapters] = useState(false)
  const [currentGeneratingChapter, setCurrentGeneratingChapter] = useState<number | null>(null)
  const [chapterProgress, setChapterProgress] = useState<Record<number, string>>({})
  type DownloadFormat = 'pdf' | 'docx'
  const [downloadingFormat, setDownloadingFormat] = useState<DownloadFormat | null>(null)

  useEffect(() => {
    fetchBook()
  }, [bookId])

  // Auto-start chapter generation when book loads
  useEffect(() => {
    if (book && !generatingChapters) {
      startChapterGeneration()
    }
  }, [book])

  const fetchBook = async () => {
    try {
      const response = await fetch(`/api/books/${bookId}`)
      if (!response.ok) {
        throw new Error('Book not found')
      }
      const data = await response.json()
      setBook(data)
    } catch (error) {
      console.error('Error fetching book:', error)
      alert('Failed to load book')
      router.push('/dashboard/books')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (content: any) => {
    if (!content) {
      console.warn('No content to save')
      return
    }
    
    setSaving(true)
    try {
      const response = await fetch(`/api/books/${bookId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })

      if (response.ok) {
        console.log('Book saved successfully')
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Failed to save book:', response.status, errorData)
      }
    } catch (error) {
      console.error('Error saving book:', error)
      // Don't alert on auto-save failures to avoid annoying the user
    } finally {
      setSaving(false)
    }
  }

  const startChapterGeneration = async () => {
    if (!book || !book.content) return
    
    const content = book.content as any
    
    // Check if book has outline structure (new format)
    if (!content.outline?.chapters || !content.chapterStatus) {
      console.log('[Chapter Gen] Book does not have outline structure')
      return
    }

    // Find pending chapters
    const pendingChapters = content.outline.chapters.filter(
      (ch: any) => content.chapterStatus[ch.number] === 'pending'
    )

    if (pendingChapters.length === 0) {
      console.log('[Chapter Gen] No pending chapters to generate')
      return
    }

    setGeneratingChapters(true)
    console.log(`[Chapter Gen] Starting generation of ${pendingChapters.length} chapters`)

    // Generate chapters sequentially
    for (const chapter of pendingChapters) {
      try {
        console.log(`[Chapter Gen] Generating Chapter ${chapter.number}: ${chapter.title}`)
        setCurrentGeneratingChapter(chapter.number)
        setChapterProgress(prev => ({ ...prev, [chapter.number]: 'generating' }))

        const response = await fetch(`/api/books/${bookId}/generate-chapter`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chapterNumber: chapter.number }),
        })

        if (response.ok) {
          const result = await response.json()
          console.log(`[Chapter Gen] Completed Chapter ${chapter.number}`)
          setChapterProgress(prev => ({ ...prev, [chapter.number]: 'completed' }))
          
          // Refresh book data to get updated content
          await fetchBook()
        } else {
          console.error(`[Chapter Gen] Failed to generate Chapter ${chapter.number}`)
          setChapterProgress(prev => ({ ...prev, [chapter.number]: 'error' }))
        }
      } catch (error) {
        console.error(`[Chapter Gen] Error generating Chapter ${chapter.number}:`, error)
        setChapterProgress(prev => ({ ...prev, [chapter.number]: 'error' }))
      }
    }

    setGeneratingChapters(false)
    setCurrentGeneratingChapter(null)
    console.log('[Chapter Gen] All chapters generated!')
  }

  const getSafeFileName = (title: string, extension: 'pdf' | 'docx') => {
    const safeTitle = title
      ? title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      : 'book'
    return `${safeTitle || 'book'}.${extension}`
  }

  const handleDownload = async (format: DownloadFormat) => {
    if (!book) return
    const pages = (book.content as any)?.pages

    if (!pages || pages.length === 0) {
      alert('Please save your book at least once before downloading.')
      return
    }

    if (downloadingFormat) return
    setDownloadingFormat(format)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('pothigpt-download-status', {
          detail: { format, state: 'started' },
        })
      )
    }
    const title = book.title || 'My Book'

    try {
      if (format === 'pdf') {
        const blob = await generatePDF(pages, title)
        downloadPDF(blob, getSafeFileName(title, 'pdf'))
      } else {
        const blob = await generateDOCX(pages, title)
        downloadDOCX(blob, getSafeFileName(title, 'docx'))
      }
    } catch (error) {
      console.error('Error downloading book:', error)
      alert(`Failed to download ${format.toUpperCase()}. Please try again.`)
    } finally {
      setDownloadingFormat(null)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('pothigpt-download-status', {
            detail: { format, state: 'finished' },
          })
        )
      }
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    const listener = (event: Event) => {
      const customEvent = event as CustomEvent<{ format?: DownloadFormat }>
      const format = customEvent.detail?.format
      if (!format) return
      handleDownload(format)
    }
    window.addEventListener('pothigpt-download', listener as EventListener)
    return () => window.removeEventListener('pothigpt-download', listener as EventListener)
  }, [book, downloadingFormat])

  if (loading) {
    return (
      <Flex align="center" justify="center" className="min-h-screen">
        <Text size="6" weight="bold" style={{ color: '#1e293b' }}>Loading editor...</Text>
      </Flex>
    )
  }

  if (!book) {
    return (
      <Flex align="center" justify="center" className="min-h-screen">
        <Text size="6" weight="bold" style={{ color: '#1e293b' }}>Book not found</Text>
      </Flex>
    )
  }

  return (
    <Box className="pb-6">
      <Flex justify="between" align="center" px="4" py="3" className="mb-4" gap="4">
        <Button
          size="2"
          variant="ghost"
          onClick={() => router.push('/dashboard/books')}
          className="!cursor-pointer !font-medium !justify-start !w-fit"
          style={{ color: '#64748b' }}
        >
          <Flex align="center" gap="2">
            <ArrowLeftIcon width="14" height="14" />
            <Text>Back to Books</Text>
          </Flex>
        </Button>

        <Flex align="center" gap="4" style={{ flex: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <Flex direction="column" align="end" gap="1" className="text-right">
            <Heading size="6" weight="bold" style={{ color: '#1e293b' }}>
              {book.title}
            </Heading>
            {saving && (
              <Badge size="2" color="blue" variant="soft" highContrast>
                <Flex align="center" gap="2" className="animate-pulse">
                  <CheckCircledIcon width="14" height="14" />
                  <Text weight="bold">Saving...</Text>
                </Flex>
              </Badge>
            )}
          </Flex>

          <Flex align="center" gap="2" style={{ flexShrink: 0 }}>
            <Button
              size="3"
              color="blue"
              variant="solid"
              disabled={downloadingFormat !== null}
              onClick={() => handleDownload('pdf')}
              className="!cursor-pointer"
            >
              <Flex align="center" gap="2">
                <DownloadIcon width="16" height="16" />
                <Text>{downloadingFormat === 'pdf' ? 'Downloading...' : 'Download PDF'}</Text>
              </Flex>
            </Button>
            <Button
              size="3"
              color="green"
              variant="solid"
              disabled={downloadingFormat !== null}
              onClick={() => handleDownload('docx')}
              className="!cursor-pointer"
            >
              <Flex align="center" gap="2">
                <DownloadIcon width="16" height="16" />
                <Text>{downloadingFormat === 'docx' ? 'Downloading...' : 'Download DOCX'}</Text>
              </Flex>
            </Button>
          </Flex>
        </Flex>
      </Flex>

      {/* Chapter Generation Progress Banner */}
      {generatingChapters && currentGeneratingChapter && (
        <Box 
          className="mb-6 mx-4"
          style={{
            background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
            border: '2px solid #3b82f6',
            borderRadius: '12px',
            padding: '1rem 1.5rem'
          }}
        >
          <Flex direction="column" gap="3">
            <Flex justify="between" align="center">
              <Flex align="center" gap="3">
                <div className="animate-spin" style={{ width: '20px', height: '20px', border: '3px solid #3b82f6', borderTop: '3px solid transparent', borderRadius: '50%' }} />
                <Text size="4" weight="bold" style={{ color: '#1e40af' }}>
                  Generating Chapter {currentGeneratingChapter}
                </Text>
              </Flex>
              <Badge size="2" color="blue" variant="solid">
                AI Writing
              </Badge>
            </Flex>
            <Text size="2" style={{ color: '#1e40af' }}>
              The AI is progressively creating each chapter with context from previous chapters. This may take a minute per chapter.
            </Text>
            {/* Chapter status indicators */}
            <Flex gap="2" wrap="wrap">
              {(book.content as any)?.outline?.chapters?.map((ch: any) => (
                <Badge 
                  key={ch.number}
                  size="1"
                  color={
                    chapterProgress[ch.number] === 'completed' ? 'green' :
                    chapterProgress[ch.number] === 'generating' ? 'blue' :
                    chapterProgress[ch.number] === 'error' ? 'red' : 'gray'
                  }
                  variant={chapterProgress[ch.number] === 'generating' ? 'solid' : 'soft'}
                >
                  Ch {ch.number}: {
                    chapterProgress[ch.number] === 'completed' ? '✓' :
                    chapterProgress[ch.number] === 'generating' ? '⋯' :
                    chapterProgress[ch.number] === 'error' ? '✗' : '○'
                  }
                </Badge>
              ))}
            </Flex>
          </Flex>
        </Box>
      )}

      {/* Editor */}
      <Box px="4">
        <CanvasEditor
          initialContent={book.content}
          onSave={handleSave}
          generatedContent={(book.content as any)?.generatedContent}
          authorName={session?.user?.name || undefined}
          bookTitle={book.title}
          generatingChapters={generatingChapters}
          currentGeneratingChapter={currentGeneratingChapter}
          chapterProgress={chapterProgress}
          chapters={(book.content as any)?.outline?.chapters || []}
        />
      </Box>
    </Box>
  )
}
