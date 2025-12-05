'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { CanvasEditor } from '@/components/editor/CanvasEditor'
import { Book } from '@/types'
import { Flex, Text, Button, Box, Badge, Heading, Separator, DropdownMenu, IconButton, Tooltip, TextField, Select } from '@radix-ui/themes'
import { 
  ArrowLeftIcon, 
  CheckCircledIcon, 
  DownloadIcon, 
  SpeakerLoudIcon, 
  ReloadIcon, 
  PlayIcon, 
  Cross2Icon,
  HamburgerMenuIcon,
  FileTextIcon,
  StarIcon,
  Pencil1Icon,
  ResetIcon,
  MixIcon,
  DotsHorizontalIcon,
  FontBoldIcon,
  FontItalicIcon,
  UnderlineIcon,
  TextAlignLeftIcon,
  TextAlignCenterIcon,
  TextAlignRightIcon,
  TextAlignJustifyIcon,
  ListBulletIcon,
  Share1Icon,
  ZoomInIcon,
  ZoomOutIcon
} from '@radix-ui/react-icons'
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
  const [generatingAudiobook, setGeneratingAudiobook] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const [selectedTextObject, setSelectedTextObject] = useState<any>(null)
  const [showMagicWrite, setShowMagicWrite] = useState(false)
  const [fontSize, setFontSize] = useState(16)
  const [fontFamily, setFontFamily] = useState('Arial')
  const [textColor, setTextColor] = useState('#000000')
  const [textAlign, setTextAlign] = useState('left')
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(100)

  // Handler to update text formatting in CanvasEditor
  const updateTextFormat = (property: string, value: any) => {
    if (typeof window !== 'undefined' && selectedTextObject) {
      window.dispatchEvent(new CustomEvent('pothigpt-update-text', {
        detail: { property, value }
      }))
    }
  }

  useEffect(() => {
    fetchBook()
    
    // Listen for zoom level changes
    const handleZoomChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ zoomLevel: number }>
      setZoomLevel(customEvent.detail.zoomLevel)
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('pothigpt-zoom-change', handleZoomChange as EventListener)
    }
    
    // Cleanup: abort any ongoing requests on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('pothigpt-zoom-change', handleZoomChange as EventListener)
      }
    }
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

  const handleCancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setGeneratingChapters(false)
    setCurrentGeneratingChapter(null)
    console.log('[Chapter Gen] Generation cancelled by user')
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

    // Create new AbortController for this generation session
    abortControllerRef.current = new AbortController()
    const signal = abortControllerRef.current.signal

    setGeneratingChapters(true)
    console.log(`[Chapter Gen] Starting generation of ${pendingChapters.length} chapters`)

    // Generate chapters sequentially
    for (const chapter of pendingChapters) {
      // Check if cancelled
      if (signal.aborted) {
        console.log('[Chapter Gen] Generation cancelled')
        break
      }

      try {
        console.log(`[Chapter Gen] Generating Chapter ${chapter.number}: ${chapter.title}`)
        setCurrentGeneratingChapter(chapter.number)
        setChapterProgress(prev => ({ ...prev, [chapter.number]: 'generating' }))

        const response = await fetch(`/api/books/${bookId}/generate-chapter`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chapterNumber: chapter.number }),
          signal,
        })

        if (signal.aborted) {
          console.log('[Chapter Gen] Request was aborted')
          break
        }

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
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.log('[Chapter Gen] Request was aborted')
          break
        }
        console.error(`[Chapter Gen] Error generating Chapter ${chapter.number}:`, error)
        setChapterProgress(prev => ({ ...prev, [chapter.number]: 'error' }))
      }
    }

    setGeneratingChapters(false)
    setCurrentGeneratingChapter(null)
    abortControllerRef.current = null
    console.log('[Chapter Gen] Generation process finished')
  }

  const getSafeFileName = (title: string, extension: 'pdf' | 'docx') => {
    const safeTitle = title
      ? title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      : 'book'
    return `${safeTitle || 'book'}.${extension}`
  }

  const handleGenerateAudiobook = async () => {
    if (!book) return

    setGeneratingAudiobook(true)
    try {
      const response = await fetch(`/api/books/${bookId}/generate-audiobook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to generate audiobook')
      }

      const data = await response.json()
      
      // Refresh book data
      await fetchBook()
      
      alert('Audiobook generation started! This may take several minutes.')
    } catch (error) {
      console.error('Error generating audiobook:', error)
      alert(error instanceof Error ? error.message : 'Failed to generate audiobook')
    } finally {
      setGeneratingAudiobook(false)
    }
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
        <Text size="4" weight="bold" className="text-base md:text-xl" style={{ color: '#1e293b' }}>Loading editor...</Text>
      </Flex>
    )
  }

  if (!book) {
    return (
      <Flex align="center" justify="center" className="min-h-screen">
        <Text size="4" weight="bold" className="text-base md:text-xl" style={{ color: '#1e293b' }}>Book not found</Text>
      </Flex>
    )
  }

  return (
    <Box className="pb-4 sm:pb-6">
      {/* Enhanced Canva-Style Toolbar */}
      <Box
        style={{
          height: '64px',
          background: 'linear-gradient(to bottom, #ffffff 0%, #f8fafc 100%)',
          borderBottom: '1px solid rgba(226, 232, 240, 0.9)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          width: '100%',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Flex
          align="center"
          justify="between"
          height="100%"
          px={{ initial: '2', sm: '3', md: '4' }}
          gap="2"
          style={{ width: '100%', minWidth: 0 }}
        >
          {/* Left Section */}
          <Flex align="center" gap="1" style={{ flexShrink: 0 }} className="overflow-x-auto">
            <Tooltip content="Menu">
              <IconButton
          size="2"
          variant="ghost"
                className="!cursor-pointer flex-shrink-0"
          onClick={() => router.push('/dashboard/books')}
              >
                <HamburgerMenuIcon width="16" height="16" />
              </IconButton>
            </Tooltip>

            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                <Button size="2" variant="ghost" className="!cursor-pointer flex-shrink-0">
                  <FileTextIcon width="16" height="16" />
                  <Text size="2" className="hidden md:inline ml-1">File</Text>
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content>
                <DropdownMenu.Item onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('pothigpt-save'))
                  }
                }}>
                  <Text>Save</Text>
                </DropdownMenu.Item>
                <DropdownMenu.Separator />
                <DropdownMenu.Item onClick={() => handleDownload('pdf')}>
                  <Text>Export as PDF</Text>
                </DropdownMenu.Item>
                <DropdownMenu.Item onClick={() => handleDownload('docx')}>
                  <Text>Export as DOCX</Text>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>

            <Tooltip content="Magic Switch">
              <IconButton size="2" variant="ghost" className="!cursor-pointer flex-shrink-0 hidden sm:flex">
                <StarIcon width="16" height="16" />
              </IconButton>
            </Tooltip>

            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                <Button size="2" variant="ghost" className="!cursor-pointer flex-shrink-0 hidden sm:flex">
                  <Pencil1Icon width="16" height="16" />
                  <Text size="2" className="hidden md:inline ml-1">Editing</Text>
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content>
                <DropdownMenu.Item>
                  <Text>Edit Mode</Text>
                </DropdownMenu.Item>
                <DropdownMenu.Item>
                  <Text>View Mode</Text>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>

            <Separator orientation="vertical" size="2" className="hidden md:block" />

            <Tooltip content="Undo (⌘Z)">
              <IconButton 
                size="2" 
                variant={canUndo ? "soft" : "ghost"}
                color={canUndo ? "blue" : "gray"}
                className="!cursor-pointer flex-shrink-0"
                disabled={!canUndo}
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('pothigpt-undo'))
                  }
                }}
                style={{
                  opacity: canUndo ? 1 : 0.5,
                  transition: 'all 0.2s ease'
                }}
              >
                <ResetIcon width="16" height="16" />
              </IconButton>
            </Tooltip>

            <Tooltip content="Redo (⌘⇧Z)">
              <IconButton 
                size="2" 
                variant={canRedo ? "soft" : "ghost"}
                color={canRedo ? "blue" : "gray"}
                className="!cursor-pointer flex-shrink-0"
                disabled={!canRedo}
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('pothigpt-redo'))
                  }
                }}
                style={{
                  opacity: canRedo ? 1 : 0.5,
                  transition: 'all 0.2s ease'
                }}
        >
                <MixIcon width="16" height="16" />
              </IconButton>
            </Tooltip>

            <Separator orientation="vertical" size="2" className="hidden md:block" />

            <Tooltip content="Zoom Out">
              <IconButton 
                size="2" 
                variant="soft" 
                color="gray"
                className="!cursor-pointer flex-shrink-0"
                disabled={zoomLevel <= 25}
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('pothigpt-zoom-out'))
                  }
                }}
                style={{
                  opacity: zoomLevel <= 25 ? 0.5 : 1
                }}
              >
                <ZoomOutIcon width="16" height="16" />
              </IconButton>
            </Tooltip>

            <Tooltip content={`Zoom: ${zoomLevel}%`}>
              <Button 
                size="2" 
                variant="soft" 
                color="gray"
                className="!cursor-pointer flex-shrink-0 !px-3"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('pothigpt-zoom-reset'))
                  }
                }}
              >
                <Text size="1" className="text-xs font-semibold">{zoomLevel}%</Text>
              </Button>
            </Tooltip>

            <Tooltip content="Zoom In">
              <IconButton 
                size="2" 
                variant="soft" 
                color="gray"
                className="!cursor-pointer flex-shrink-0"
                disabled={zoomLevel >= 200}
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('pothigpt-zoom-in'))
                  }
                }}
                style={{
                  opacity: zoomLevel >= 200 ? 0.5 : 1
                }}
              >
                <ZoomInIcon width="16" height="16" />
              </IconButton>
            </Tooltip>

            <Separator orientation="vertical" size="2" className="hidden md:block" />

            <Tooltip content={saving ? 'Saving...' : 'Saved'}>
              <IconButton size="2" variant="ghost" className="!cursor-pointer flex-shrink-0">
                {saving ? (
                  <ReloadIcon width="16" height="16" className="animate-spin" style={{ color: '#3b82f6' }} />
                ) : (
                  <CheckCircledIcon width="16" height="16" style={{ color: '#10b981' }} />
                )}
              </IconButton>
            </Tooltip>
          </Flex>

          {/* Center Section - Text Formatting (only when text is selected) */}
          {selectedTextObject && (
            <Flex align="center" gap="1" style={{ flex: '1 1 auto', justifyContent: 'center', minWidth: 0 }} className="hidden md:flex">
              <Button 
                size="2" 
                variant="soft" 
                color="purple" 
                className="!cursor-pointer"
                onClick={() => setShowMagicWrite(true)}
              >
                <StarIcon width="14" height="14" />
                <Text size="1" className="hidden lg:inline ml-1">Magic Write</Text>
              </Button>

              <Separator orientation="vertical" size="2" />

              <Button size="2" variant="soft" className="!cursor-pointer">
                <Text size="1" weight="bold">H1</Text>
              </Button>
              <Button size="2" variant="soft" className="!cursor-pointer">
                <Text size="1" weight="bold">H2</Text>
        </Button>

              <Select.Root 
                value={fontFamily} 
                onValueChange={(value) => {
                  setFontFamily(value)
                  updateTextFormat('fontFamily', value)
                }}
              >
                <Select.Trigger variant="soft" style={{ minWidth: '100px' }} />
                <Select.Content>
                  <Select.Item value="Arial">Arial</Select.Item>
                  <Select.Item value="Times New Roman">Times New Roman</Select.Item>
                  <Select.Item value="Georgia">Georgia</Select.Item>
                  <Select.Item value="Helvetica">Helvetica</Select.Item>
                  <Select.Item value="Courier New">Courier New</Select.Item>
                  <Select.Item value="Verdana">Verdana</Select.Item>
                </Select.Content>
              </Select.Root>

              <Flex align="center" gap="0" style={{ border: '1px solid #e0e7ff', borderRadius: '6px' }}>
                <IconButton 
                  size="2" 
                  variant="ghost" 
                  onClick={() => {
                    const newSize = Math.max(8, fontSize - 1)
                    setFontSize(newSize)
                    updateTextFormat('fontSize', newSize)
                  }}
                >
                  <Text size="1">−</Text>
                </IconButton>
                <TextField.Root
                  size="2"
                  value={String(fontSize)}
                  onChange={(e) => {
                    const newSize = parseInt(e.target.value) || 16
                    setFontSize(newSize)
                    updateTextFormat('fontSize', newSize)
                  }}
                  style={{ width: '50px', textAlign: 'center' }}
                />
                <IconButton 
                  size="2" 
                  variant="ghost" 
                  onClick={() => {
                    const newSize = Math.min(144, fontSize + 1)
                    setFontSize(newSize)
                    updateTextFormat('fontSize', newSize)
                  }}
                >
                  <Text size="1">+</Text>
                </IconButton>
              </Flex>

              <input
                type="color"
                value={textColor}
                onChange={(e) => {
                  setTextColor(e.target.value)
                  updateTextFormat('textColor', e.target.value)
                }}
                style={{ width: '32px', height: '32px', border: '1px solid #e0e7ff', borderRadius: '6px', cursor: 'pointer' }}
              />

              <Separator orientation="vertical" size="2" />

              <IconButton 
                size="2" 
                variant={selectedTextObject?.fontWeight === 'bold' ? 'solid' : 'soft'} 
                className="!cursor-pointer"
                onClick={() => updateTextFormat('fontWeight', selectedTextObject?.fontWeight === 'bold' ? 'normal' : 'bold')}
              >
                <FontBoldIcon width="16" height="16" />
              </IconButton>
              <IconButton 
                size="2" 
                variant={selectedTextObject?.fontStyle === 'italic' ? 'solid' : 'soft'} 
                className="!cursor-pointer"
                onClick={() => updateTextFormat('fontStyle', selectedTextObject?.fontStyle === 'italic' ? 'normal' : 'italic')}
              >
                <FontItalicIcon width="16" height="16" />
              </IconButton>
              <IconButton 
                size="2" 
                variant={selectedTextObject?.underline ? 'solid' : 'soft'} 
                className="!cursor-pointer"
                onClick={() => updateTextFormat('underline', !selectedTextObject?.underline)}
              >
                <UnderlineIcon width="16" height="16" />
              </IconButton>

              <Separator orientation="vertical" size="2" />

              <IconButton 
                size="2" 
                variant={textAlign === 'left' ? 'solid' : 'soft'} 
                onClick={() => {
                  setTextAlign('left')
                  updateTextFormat('textAlign', 'left')
                }} 
                className="!cursor-pointer"
              >
                <TextAlignLeftIcon width="16" height="16" />
              </IconButton>
              <IconButton 
                size="2" 
                variant={textAlign === 'center' ? 'solid' : 'soft'} 
                onClick={() => {
                  setTextAlign('center')
                  updateTextFormat('textAlign', 'center')
                }} 
                className="!cursor-pointer"
              >
                <TextAlignCenterIcon width="16" height="16" />
              </IconButton>
              <IconButton 
                size="2" 
                variant={textAlign === 'right' ? 'solid' : 'soft'} 
                onClick={() => {
                  setTextAlign('right')
                  updateTextFormat('textAlign', 'right')
                }} 
                className="!cursor-pointer"
              >
                <TextAlignRightIcon width="16" height="16" />
              </IconButton>
              <IconButton 
                size="2" 
                variant={textAlign === 'justify' ? 'solid' : 'soft'} 
                onClick={() => {
                  setTextAlign('justify')
                  updateTextFormat('textAlign', 'justify')
                }} 
                className="!cursor-pointer"
              >
                <TextAlignJustifyIcon width="16" height="16" />
              </IconButton>

              <IconButton size="2" variant="soft" className="!cursor-pointer">
                <ListBulletIcon width="16" height="16" />
              </IconButton>

              <IconButton size="2" variant="soft" className="!cursor-pointer">
                <DotsHorizontalIcon width="16" height="16" />
              </IconButton>
            </Flex>
          )}

          {/* Right Section */}
          <Flex align="center" gap="2" style={{ flexShrink: 0 }} className="overflow-x-auto">
            <Heading size="3" weight="bold" style={{ color: '#1e293b' }} className="hidden xl:block truncate max-w-xs">
              {book.title}
            </Heading>

            <Button
              size="2"
              color="blue"
              variant="solid"
              disabled={downloadingFormat !== null}
              onClick={() => handleDownload('pdf')}
              className="!cursor-pointer flex-shrink-0"
            >
              <DownloadIcon width="14" height="14" />
              <Text size="2" className="hidden md:inline ml-1 text-xs">
                {downloadingFormat === 'pdf' ? 'Downloading...' : 'PDF'}
              </Text>
            </Button>

            <Button
              size="2"
              color="green"
              variant="solid"
              disabled={downloadingFormat !== null}
              onClick={() => handleDownload('docx')}
              className="!cursor-pointer flex-shrink-0"
            >
              <DownloadIcon width="14" height="14" />
              <Text size="2" className="hidden md:inline ml-1 text-xs">
                {downloadingFormat === 'docx' ? 'Downloading...' : 'DOCX'}
              </Text>
            </Button>

            <Tooltip content="Share">
              <IconButton size="2" variant="soft" className="!cursor-pointer flex-shrink-0 hidden sm:flex">
                <Share1Icon width="16" height="16" />
              </IconButton>
            </Tooltip>
          </Flex>
        </Flex>
      </Box>

      {/* Magic Write Modal */}
      {showMagicWrite && (
        <Box
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={() => setShowMagicWrite(false)}
        >
          <Box
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Flex direction="column" gap="4">
              <Flex justify="between" align="center">
                <Heading size="4" weight="bold">Magic Write</Heading>
                <IconButton size="2" variant="ghost" onClick={() => setShowMagicWrite(false)}>
                  <Cross2Icon width="16" height="16" />
                </IconButton>
              </Flex>
              <Text size="2" style={{ color: '#64748b' }}>
                Enter a prompt to generate text with AI
              </Text>
              <Box asChild>
                <textarea
                  placeholder="E.g., Write a paragraph about..."
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    padding: '12px',
                    border: '1px solid #e0e7ff',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </Box>
              <Flex gap="2" justify="end">
                <Button size="2" variant="soft" onClick={() => setShowMagicWrite(false)}>
                  Cancel
                </Button>
                <Button size="2" variant="solid" color="purple">
                  Generate
                </Button>
        </Flex>
      </Flex>
          </Box>
        </Box>
      )}

      {/* Chapter Generation Progress Banner - Small corner widget */}
      {generatingChapters && currentGeneratingChapter && (
        <Box 
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
            border: '1px solid #3b82f6',
            borderRadius: '8px',
            padding: '0.5rem 0.75rem',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
            maxWidth: '280px',
            minWidth: '200px'
          }}
        >
          <Flex direction="column" gap="1.5">
            <Flex 
              justify="between" 
              align="center" 
              gap="2"
            >
              <Flex align="center" gap="1.5">
                <div className="animate-spin" style={{ width: '12px', height: '12px', border: '2px solid #3b82f6', borderTop: '2px solid transparent', borderRadius: '50%' }} />
                <Text size="1" weight="bold" className="text-xs" style={{ color: '#1e40af' }}>
                  Ch {currentGeneratingChapter}
                </Text>
              </Flex>
              <Button
                size="1"
                variant="ghost"
                color="red"
                onClick={handleCancelGeneration}
                className="!cursor-pointer"
                style={{ 
                  padding: '2px 6px',
                  minWidth: 'auto'
                }}
              >
                <Cross2Icon width="10" height="10" />
              </Button>
            </Flex>
            {/* Chapter status indicators - compact */}
            <Flex gap="0.5" wrap="wrap">
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
                  style={{ fontSize: '10px', padding: '2px 6px' }}
                >
                  {ch.number}: {
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

      {/* Audiobook Section */}
      <Box 
        className="mb-4 sm:mb-6 mx-2 sm:mx-4 md:mx-6"
        style={{
          background: 'white',
          border: '1px solid #e0e7ff',
          borderRadius: '12px',
        }}
        p={{ initial: '3', sm: '4', md: '6' }}
      >
        <Flex direction="column" gap={{ initial: '3', sm: '4' }}>
          <Flex 
            direction={{ initial: 'column', sm: 'row' }}
            justify="between" 
            align={{ initial: 'start', sm: 'center' }}
            gap={{ initial: '2', sm: '3' }}
          >
            <Flex align="center" gap={{ initial: '2', sm: '3' }}>
              <SpeakerLoudIcon width="20" height="20" className="sm:w-6 sm:h-6" color="#3b82f6" />
              <Heading size="4" weight="bold" className="text-lg sm:text-xl" style={{ color: '#1e293b' }}>
                Audiobook
              </Heading>
            </Flex>
            {book.audiobookStatus && (
              <Badge 
                color={
                  book.audiobookStatus === 'COMPLETED' ? 'green' :
                  book.audiobookStatus === 'PROCESSING' ? 'yellow' :
                  book.audiobookStatus === 'FAILED' ? 'red' : 'gray'
                }
                variant="soft"
                size="1"
                className="text-xs sm:text-sm"
              >
                {book.audiobookStatus}
              </Badge>
            )}
          </Flex>

          {book.audiobookStatus === 'COMPLETED' && book.audiobookUrl ? (
            <Flex direction="column" gap={{ initial: '2', sm: '3' }}>
              <Text size="2" className="text-xs sm:text-sm" style={{ color: '#64748b' }}>
                Your audiobook is ready! Listen to it below or download it.
              </Text>
              <Flex direction={{ initial: 'column', sm: 'row' }} gap={{ initial: '2', sm: '3' }} align={{ initial: 'stretch', sm: 'center' }}>
                <audio controls className="w-full sm:flex-1" style={{ maxWidth: '100%' }}>
                  <source src={book.audiobookUrl} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
                <Button
                  size="2"
                  variant="solid"
                  color="blue"
                  onClick={() => {
                    const link = document.createElement('a')
                    link.href = book.audiobookUrl!
                    link.download = `${book.title.replace(/\s+/g, '-')}-audiobook.mp3`
                    link.click()
                  }}
                  className="!cursor-pointer w-full sm:w-auto text-xs sm:text-sm"
                >
                  <Flex align="center" gap="2">
                    <DownloadIcon width="16" height="16" />
                    <Text size="2" className="text-xs sm:text-sm">Download Audiobook</Text>
                  </Flex>
                </Button>
              </Flex>
            </Flex>
          ) : book.audiobookStatus === 'PROCESSING' ? (
            <Flex direction="column" gap={{ initial: '2', sm: '3' }}>
              <Flex align="center" gap={{ initial: '2', sm: '3' }}>
                <div className="animate-spin" style={{ width: '18px', height: '18px', border: '3px solid #3b82f6', borderTop: '3px solid transparent', borderRadius: '50%' }} />
                <Text size="2" weight="bold" className="text-xs sm:text-sm" style={{ color: '#1e40af' }}>
                  Generating audiobook...
                </Text>
              </Flex>
              <Text size="1" className="text-xs" style={{ color: '#64748b' }}>
                This may take several minutes depending on the length of your book. Please wait.
              </Text>
            </Flex>
          ) : book.audiobookStatus === 'FAILED' ? (
            <Flex direction="column" gap={{ initial: '2', sm: '3' }}>
              <Text size="2" className="text-xs sm:text-sm" style={{ color: '#dc2626' }}>
                Audiobook generation failed. Please try again.
              </Text>
              <Button
                size="2"
                variant="solid"
                color="blue"
                onClick={handleGenerateAudiobook}
                disabled={generatingAudiobook}
                className="!cursor-pointer w-full sm:w-fit text-xs sm:text-sm"
              >
                <Flex align="center" gap="2">
                  <ReloadIcon width="16" height="16" />
                  <Text size="2" className="text-xs sm:text-sm">Retry Generation</Text>
                </Flex>
              </Button>
            </Flex>
          ) : (
            <Flex direction="column" gap={{ initial: '2', sm: '3' }}>
              <Text size="2" className="text-xs sm:text-sm" style={{ color: '#64748b' }}>
                Convert your book to an audiobook using AI-powered text-to-speech. This will extract text from your PDF or book content and generate a high-quality audio narration.
              </Text>
              <Button
                size="2"
                variant="solid"
                color="blue"
                onClick={handleGenerateAudiobook}
                disabled={generatingAudiobook}
                className="!cursor-pointer w-full sm:w-fit text-xs sm:text-sm"
              >
                {generatingAudiobook ? (
                  <Flex align="center" gap="2">
                    <ReloadIcon className="animate-spin" width="16" height="16" />
                    <Text size="2" className="text-xs sm:text-sm">Generating...</Text>
                  </Flex>
                ) : (
                  <Flex align="center" gap="2">
                    <PlayIcon width="16" height="16" />
                    <Text size="2" className="text-xs sm:text-sm">Generate Audiobook</Text>
                  </Flex>
                )}
              </Button>
            </Flex>
          )}
        </Flex>
      </Box>

      {/* Editor */}
      <Box px={{ initial: '2', sm: '4', md: '6' }}>
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
          onSelectionChange={(obj) => {
            setSelectedTextObject(obj)
            if (obj && obj.type === 'textbox') {
              setFontSize((obj as any).fontSize || 16)
              setFontFamily((obj as any).fontFamily || 'Arial')
              setTextColor(((obj as any).fill as string) || '#000000')
              setTextAlign((obj as any).textAlign || 'left')
            }
          }}
          onUndoRedoChange={(canUndoValue, canRedoValue) => {
            setCanUndo(canUndoValue)
            setCanRedo(canRedoValue)
          }}
        />
      </Box>
    </Box>
  )
}
