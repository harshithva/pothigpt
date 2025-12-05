'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import * as fabric from 'fabric'
import { ScrollArea, Flex, Button as RadixButton, Box, Text, Grid, Card, Select, Separator, Tooltip, IconButton, Badge } from '@radix-ui/themes'
import {
  TextIcon,
  FontBoldIcon,
  FontItalicIcon,
  UnderlineIcon,
  ImageIcon,
  TrashIcon,
  DownloadIcon,
  PlusIcon,
  Cross2Icon,
  MixIcon,
  LayersIcon,
  ZoomInIcon,
  ZoomOutIcon,
  ResetIcon,
  CopyIcon,
  LockClosedIcon,
  LockOpen1Icon,
} from '@radix-ui/react-icons'
import { generatePDF, downloadPDF } from '@/lib/pdf-generator'
import { generateDOCX, downloadDOCX } from '@/lib/docx-generator'
import { generateIdeogramImage, downloadImageAsDataUrl } from '@/lib/ideogram-api'

interface CanvasEditorProps {
  initialContent?: any
  onSave: (content: any) => void
  generatedContent?: any
  authorName?: string
  bookTitle?: string
  generatingChapters?: boolean
  currentGeneratingChapter?: number | null
  chapterProgress?: Record<number, string>
  chapters?: any[]
  onSelectionChange?: (selectedObject: any) => void
  onUndoRedoChange?: (canUndo: boolean, canRedo: boolean) => void
}

export const CanvasEditor: React.FC<CanvasEditorProps> = ({
  initialContent,
  onSave,
  generatedContent,
  authorName,
  bookTitle,
  generatingChapters = false,
  currentGeneratingChapter = null,
  chapterProgress = {},
  chapters = [],
  onSelectionChange,
  onUndoRedoChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null)
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [pages, setPages] = useState<any[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [lastGeneratedCount, setLastGeneratedCount] = useState(0)
  const [showTools, setShowTools] = useState(true) // Show tools panel by default
  const [showPages, setShowPages] = useState(true) // Show pages panel by default
  const [showImagePanel, setShowImagePanel] = useState(false) // Show image generation panel
  const [exporting, setExporting] = useState(false) // Track export state

  // Image generation state
  const [imagePrompt, setImagePrompt] = useState('')
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<any[]>([])

  // Enhanced formatting state
  const [fontSize, setFontSize] = useState(16)
  const [fontFamily, setFontFamily] = useState('Times New Roman')
  const [textColor, setTextColor] = useState('#000000')
  const [textAlign, setTextAlign] = useState('left')
  const [pagePreviews, setPagePreviews] = useState<Record<string, string>>({})
  const [zoomLevel, setZoomLevel] = useState(100)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  // Sync formatting state when text object is selected
  useEffect(() => {
    if (selectedObject && selectedObject.type === 'textbox') {
      const text = selectedObject as fabric.Textbox
      setFontSize(text.fontSize || 16)
      setFontFamily(text.fontFamily || 'Arial')
      setTextColor((text.fill as string) || '#000000')
      setTextAlign(text.textAlign || 'left')
    }
  }, [selectedObject])

  // Helper function to generate page preview thumbnail
  const generatePagePreview = useCallback((pageData: any, pageId: string): void => {
    try {
      // Create a temporary canvas for preview
      const tempCanvas = document.createElement('canvas')
      const tempFabricCanvas = new fabric.Canvas(tempCanvas, {
        width: 595, // Same as page width for accurate preview
        height: 842, // Same as page height
        backgroundColor: '#ffffff',
      })

      // Load the page data into the temporary canvas
      tempFabricCanvas.loadFromJSON(pageData, () => {
        tempFabricCanvas.renderAll()

        // Wait a moment for canvas to fully render
        setTimeout(() => {
          try {
            // Generate preview after canvas is loaded
            const dataURL = tempFabricCanvas.toDataURL({
              format: 'png',
              quality: 0.8,
              multiplier: 0.2 // Smaller multiplier for thumbnails
            })

            // Update the page preview in state
            setPagePreviews(prev => {
              // Only update if preview doesn't exist yet
              if (prev[pageId]) return prev
              return {
                ...prev,
                [pageId]: dataURL
              }
            })

            // Clean up
            tempFabricCanvas.dispose()
          } catch (error) {
            console.error('Error generating preview image:', error)
            tempFabricCanvas.dispose()
          }
        }, 200) // Increased timeout for better reliability
      }, {})
    } catch (error) {
      console.error('Error generating page preview:', error)
    }
  }, [])

  // History state for undo/redo
  const [history, setHistory] = useState<any[]>([])
  const [historyStep, setHistoryStep] = useState(-1)

  useEffect(() => {
    if (!canvasRef.current) return

    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width: 595, // A4 width in pixels
      height: 842, // A4 height in pixels
      backgroundColor: '#ffffff',
    })

        // Initialize zoom level
        fabricCanvas.setZoom(1)
        setZoomLevel(100)

    // Wait for canvas to be fully initialized
    const initializeCanvas = () => {
      if (!fabricCanvas || !canvasRef.current) {
        console.error('[Canvas] Canvas not available, retrying...')
        setTimeout(initializeCanvas, 100)
        return
      }

      // Check if the underlying canvas element has a context
      const canvasElement = canvasRef.current
      if (!canvasElement || !canvasElement.getContext) {
        console.error('[Canvas] Canvas element not ready, retrying...')
        setTimeout(initializeCanvas, 100)
        return
      }

      // Ensure fabric canvas has the lowerCanvasEl ready
      if (!fabricCanvas.lowerCanvasEl) {
        // Wait a bit more for fabric to fully initialize
        setTimeout(initializeCanvas, 50)
        return
      }

      console.log('[Canvas] Canvas initialized successfully')
      setCanvas(fabricCanvas)
      setIsInitialized(true)

      // Initialize with generated content or load existing
      const hasPages = initialContent?.pages && initialContent.pages.length > 0

      // Check if this is outline-based (new progressive generation)
      const hasOutline = initialContent?.outline?.chapters && Array.isArray(initialContent.outline.chapters)

      if (hasOutline && !hasPages) {
        // New outline-based structure - generate pages progressively
        console.log('[Canvas] Initializing from outline')
        const generatedChapters = initialContent.generatedChapters || {}
        setLastGeneratedCount(Object.keys(generatedChapters).length)
        initializeFromOutline(fabricCanvas, initialContent.outline, generatedChapters)
      } else if (generatedContent && !hasPages) {
        // Old full-content generation (backward compatibility)
        console.log('[Canvas] Initializing from generated content')
        initializeFromGeneratedContent(fabricCanvas, generatedContent)
      } else if (hasPages) {
        // Load existing pages
        console.log('[Canvas] Loading existing pages')
        const existingPages = initialContent.pages
        setPages(existingPages)
        setCurrentPage(0)

        // Generate previews for existing pages
        existingPages.forEach((page: any, index: number) => {
          if (page.data) {
            const pageId = page.id || `page-${index}`
            generatePagePreview(page.data, pageId)
          }
        })
      } else {
        // Create a blank page
        console.log('[Canvas] Creating blank page')
        const newPage = { id: Date.now().toString(), name: 'Page 1', data: null }
        setPages([newPage])
      }

      // Selection handlers
      fabricCanvas.on('selection:created', (e) => {
        const obj = e.selected?.[0] || null
        setSelectedObject(obj)
        onSelectionChange?.(obj)
      })

      fabricCanvas.on('selection:updated', (e) => {
        const obj = e.selected?.[0] || null
        setSelectedObject(obj)
        onSelectionChange?.(obj)
      })

      fabricCanvas.on('selection:cleared', () => {
        setSelectedObject(null)
        onSelectionChange?.(null)
      })

      // Initialize history with current canvas state
      const initialJson = fabricCanvas.toJSON()
      setHistory([initialJson])
      setHistoryStep(0)

      // Use a ref to track the current history step for event handlers
      const historyStepRef = { current: 0 }

      // Store ref globally for access in undo/redo functions
      if (typeof window !== 'undefined') {
        (window as any).historyStepRef = historyStepRef
      }

      // Auto-save history on object modifications with debouncing
      let historyTimeout: NodeJS.Timeout | null = null

      const saveHistoryToState = () => {
        if (!fabricCanvas) return
        const json = fabricCanvas.toJSON()

        setHistory(prevHistory => {
          const currentStep = historyStepRef.current
          const newHistory = prevHistory.slice(0, currentStep + 1)

          // Limit history size to 50 entries
          if (newHistory.length >= 50) {
            newHistory.shift()
          }

          newHistory.push(json)
          const newStep = newHistory.length - 1

          // Update step ref and state in sync
          historyStepRef.current = newStep
          setHistoryStep(newStep)

          // Update undo/redo state
          setCanUndo(newStep > 0)
          setCanRedo(false)
          onUndoRedoChange?.(newStep > 0, false)

          return newHistory
        })
      }

      // Update ref when historyStep changes via undo/redo
      const updateHistoryStepRef = () => {
        historyStepRef.current = historyStep
      }

      fabricCanvas.on('object:modified', () => {
        // Debounce history saves to avoid too many snapshots during dragging
        if (historyTimeout) clearTimeout(historyTimeout)
        historyTimeout = setTimeout(() => {
          saveHistoryToState()
        }, 500) // Save 500ms after modification stops
      })

      fabricCanvas.on('object:added', () => {
        // Save history when new objects are added
        if (historyTimeout) clearTimeout(historyTimeout)
        historyTimeout = setTimeout(() => {
          saveHistoryToState()
        }, 100)
      })

      fabricCanvas.on('object:removed', () => {
        // Save history when objects are removed
        if (historyTimeout) clearTimeout(historyTimeout)
        historyTimeout = setTimeout(() => {
          saveHistoryToState()
        }, 100)
      })

      fabricCanvas.on('text:changed', () => {
        // Save history when text content changes
        if (historyTimeout) clearTimeout(historyTimeout)
        historyTimeout = setTimeout(() => {
          saveHistoryToState()
        }, 1000) // Longer delay for text editing
      })
    }

    // Start initialization after a small delay to ensure DOM is ready
    setTimeout(initializeCanvas, 50)

    return () => {
      if (fabricCanvas) {
        fabricCanvas.dispose()
      }
    }
  }, [])

  // Generate previews when pages change
  useEffect(() => {
    if (pages.length > 0) {
      pages.forEach((page: any, index: number) => {
        if (page.data) {
          const pageId = page.id || `page-${index}`
          // Only generate preview if it doesn't exist yet
          setPagePreviews(prev => {
            if (prev[pageId]) return prev
            // Generate preview asynchronously
            setTimeout(() => {
              generatePagePreview(page.data, pageId)
            }, 50 * index) // Stagger generation to avoid performance issues
            return prev
          })
        }
      })
    }
  }, [pages, generatePagePreview])

  // Watch for changes to generated chapters and update pages in real-time
  useEffect(() => {
    if (!canvas || !isInitialized || !initialContent) return

    const hasOutline = initialContent?.outline?.chapters && Array.isArray(initialContent.outline.chapters)
    const hasPages = initialContent?.pages && initialContent.pages.length > 0
    const generatedChapters = initialContent?.generatedChapters || {}
    const currentGeneratedCount = Object.keys(generatedChapters).length

    // Only update if we have an outline structure, no pre-existing pages, and new chapters were generated
    if (hasOutline && !hasPages && currentGeneratedCount > lastGeneratedCount) {
      console.log(`[Canvas] Detected ${currentGeneratedCount - lastGeneratedCount} new chapter(s), regenerating pages...`)

      // Update the count tracker
      setLastGeneratedCount(currentGeneratedCount)

      // Save current page before regenerating
      if (pages.length > 0 && currentPage < pages.length) {
        const updatedPages = [...pages]
        updatedPages[currentPage].data = canvas.toJSON()
        setPages(updatedPages)
      }

      // Regenerate pages with updated content
      initializeFromOutline(canvas, initialContent.outline, generatedChapters)
    }
  }, [initialContent, canvas, isInitialized])

  // Watch for page changes and reload the canvas
  useEffect(() => {
    const currentCanvas = canvas
    if (!currentCanvas || !isInitialized || pages.length === 0) return

    // Ensure canvas element is ready before loading
    if (!currentCanvas.lowerCanvasEl && !canvasRef.current) {
      // Canvas not ready yet, wait a bit and retry
      const timeout = setTimeout(() => {
        if (currentPage >= 0 && currentPage < pages.length) {
          loadPage(currentCanvas, pages[currentPage])
        }
      }, 200)
      return () => clearTimeout(timeout)
    }

    if (currentPage >= 0 && currentPage < pages.length) {
      console.log(`[Canvas] useEffect triggered - Loading page ${currentPage + 1}`)
      // Add a small delay to ensure canvas is fully ready
      const timeout = setTimeout(() => {
        loadPage(currentCanvas, pages[currentPage])
      }, 50)
      return () => clearTimeout(timeout)
    }
  }, [currentPage, canvas, isInitialized, pages])

  // Zoom functions - zoom the canvas content itself
  const handleZoomIn = useCallback(() => {
    if (!canvas) return
    setZoomLevel(prev => {
      const newZoom = Math.min(prev + 10, 200)
      canvas.setZoom(newZoom / 100)
      canvas.renderAll()
      return newZoom
    })
  }, [canvas])

  const handleZoomOut = useCallback(() => {
    if (!canvas) return
    setZoomLevel(prev => {
      const newZoom = Math.max(prev - 10, 25)
      canvas.setZoom(newZoom / 100)
      canvas.renderAll()
      return newZoom
    })
  }, [canvas])

  const handleZoomReset = useCallback(() => {
    if (!canvas) return
    setZoomLevel(100)
    canvas.setZoom(1)
    canvas.renderAll()
  }, [canvas])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'z':
            e.preventDefault()
            if (e.shiftKey) {
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('pothigpt-redo'))
              }
            } else {
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('pothigpt-undo'))
              }
            }
            break
          case 'y':
            e.preventDefault()
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('pothigpt-redo'))
            }
            break
          case 's':
            e.preventDefault()
            savePage()
            break
          case 'b':
            e.preventDefault()
            toggleBold()
            break
          case 'i':
            e.preventDefault()
            toggleItalic()
            break
          case 'u':
            e.preventDefault()
            toggleUnderline()
            break
        }
      }
      if (e.key === 'Delete' && selectedObject) {
        deleteSelected()
      }

      // Page deletion shortcut (Cmd+Backspace or Ctrl+Backspace)
      if ((e.metaKey || e.ctrlKey) && e.key === 'Backspace' && pages.length > 1) {
        e.preventDefault()
        if (confirm(`Are you sure you want to delete "${pages[currentPage]?.name}"?`)) {
          deletePage(currentPage)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    // Listen for toolbar formatting updates
    const handleTextUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ property: string; value: any }>
      const { property, value } = customEvent.detail
      
      if (!canvas || !selectedObject || selectedObject.type !== 'textbox') return
      
      const text = selectedObject as fabric.Textbox
      
      switch (property) {
        case 'fontSize':
          changeFontSize(value)
          break
        case 'fontFamily':
          changeFontFamily(value)
          break
        case 'fill':
        case 'textColor':
          changeTextColor(value)
          break
        case 'textAlign':
          changeTextAlign(value)
          break
        case 'fontWeight':
          text.set('fontWeight', value)
          canvas.renderAll()
          saveHistory()
          break
        case 'fontStyle':
          text.set('fontStyle', value)
          canvas.renderAll()
          saveHistory()
          break
        case 'underline':
          text.set('underline', value)
          canvas.renderAll()
          saveHistory()
          break
      }
    }

    const handleSave = () => {
      savePage()
    }

    const handleUndo = () => {
      if (!canvas || historyStep <= 0 || !history || history.length === 0) return

      const newStep = historyStep - 1
      const previousState = history[newStep]

      if (previousState) {
        canvas.loadFromJSON(previousState, () => {
          canvas.renderAll()
          setHistoryStep(newStep)

          const activeObject = canvas.getActiveObject()
          setSelectedObject(activeObject || null)

          if (typeof window !== 'undefined' && (window as any).historyStepRef) {
            (window as any).historyStepRef.current = newStep
          }

          setCanUndo(newStep > 0)
          setCanRedo(newStep < history.length - 1)
          onUndoRedoChange?.(newStep > 0, newStep < history.length - 1)
        })
      }
    }

    const handleRedo = () => {
      if (!canvas || historyStep >= history.length - 1 || !history || history.length === 0) return

      const newStep = historyStep + 1
      const nextState = history[newStep]

      if (nextState) {
        canvas.loadFromJSON(nextState, () => {
          canvas.renderAll()
          setHistoryStep(newStep)

          const activeObject = canvas.getActiveObject()
          setSelectedObject(activeObject || null)

          if (typeof window !== 'undefined' && (window as any).historyStepRef) {
            (window as any).historyStepRef.current = newStep
          }

          setCanUndo(newStep > 0)
          setCanRedo(newStep < history.length - 1)
          onUndoRedoChange?.(newStep > 0, newStep < history.length - 1)
        })
      }
    }

    const handleZoomInEvent = () => {
      handleZoomIn()
    }

    const handleZoomOutEvent = () => {
      handleZoomOut()
    }

    const handleZoomResetEvent = () => {
      handleZoomReset()
    }

    const handleZoomChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ zoomLevel: number }>
      // This is handled by the useEffect above
    }

    window.addEventListener('pothigpt-update-text', handleTextUpdate as EventListener)
    window.addEventListener('pothigpt-save', handleSave)
    window.addEventListener('pothigpt-undo', handleUndo)
    window.addEventListener('pothigpt-redo', handleRedo)
    window.addEventListener('pothigpt-zoom-in', handleZoomInEvent)
    window.addEventListener('pothigpt-zoom-out', handleZoomOutEvent)
    window.addEventListener('pothigpt-zoom-reset', handleZoomResetEvent)
    window.addEventListener('pothigpt-zoom-change', handleZoomChange as EventListener)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('pothigpt-update-text', handleTextUpdate as EventListener)
      window.removeEventListener('pothigpt-save', handleSave)
      window.removeEventListener('pothigpt-undo', handleUndo)
      window.removeEventListener('pothigpt-redo', handleRedo)
      window.removeEventListener('pothigpt-zoom-in', handleZoomInEvent)
      window.removeEventListener('pothigpt-zoom-out', handleZoomOutEvent)
      window.removeEventListener('pothigpt-zoom-reset', handleZoomResetEvent)
      window.removeEventListener('pothigpt-zoom-change', handleZoomChange as EventListener)
    }
  }, [selectedObject, historyStep, history, handleZoomIn, handleZoomOut, handleZoomReset, canvas, onUndoRedoChange])

  // Helper function to strip markdown formatting from text
  const stripMarkdown = (text: string): string => {
    if (!text) return text

    // Remove markdown headings (###, ##, #)
    text = text.replace(/^#{1,6}\s+/gm, '')

    // Remove bold (**text** or __text__)
    text = text.replace(/\*\*([^*]+)\*\*/g, '$1')
    text = text.replace(/__([^_]+)__/g, '$1')

    // Remove italic (*text* or _text_)
    text = text.replace(/\*([^*]+)\*/g, '$1')
    text = text.replace(/_([^_]+)_/g, '$1')

    // Remove strikethrough (~~text~~)
    text = text.replace(/~~([^~]+)~~/g, '$1')

    // Remove code blocks (```code``` or `code`)
    text = text.replace(/```[\s\S]*?```/g, '')
    text = text.replace(/`([^`]+)`/g, '$1')

    // Remove links [text](url) - keep just the text
    text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')

    // Remove images ![alt](url) - keep just the alt text
    text = text.replace(/!\[([^\]]*)\]\([^\)]+\)/g, '$1')

    // Convert markdown list items to plain text (remove -, *, + or numbers)
    text = text.replace(/^[\s]*[-*+]\s+/gm, '') // Bullet lists
    text = text.replace(/^[\s]*\d+\.\s+/gm, '') // Numbered lists

    // Handle colons after bold text (like **text:** becomes just "text:")
    text = text.replace(/\*\*\s*([^*:]+?)\s*\*\*:/g, '$1:')
    text = text.replace(/\*\*([^*:]+?)\*\*:/g, '$1:')

    // Clean up extra whitespace
    text = text.replace(/\n{3,}/g, '\n\n')
    text = text.trim()

    return text
  }

  const initializeFromOutline = (fabricCanvas: fabric.Canvas, outline: any, generatedChapters: Record<number, string>) => {
    const newPages: any[] = []

    // Page constants
    const pageMargin = 40
    const pageWidth = 595 // A4 width
    const pageHeight = 842 // A4 height
    const contentWidth = pageWidth - (pageMargin * 2)
    const footerHeight = 40
    const maxContentHeight = pageHeight - pageMargin - footerHeight

    // Helper function to create a new page canvas
    const createNewPage = (): fabric.Canvas => {
      const tempCanvas = new fabric.Canvas(document.createElement('canvas'), {
        width: pageWidth,
        height: pageHeight,
        backgroundColor: '#ffffff',
      })
      return tempCanvas
    }

    // Helper function to create title page
    const createTitlePage = (): fabric.Canvas => {
      const pageCanvas = createNewPage()

      // Large centered title
      const titleText = new fabric.Textbox(outline.title || 'Untitled Book', {
        left: pageWidth / 2,
        top: pageHeight / 2 - 100,
        width: pageWidth - (pageMargin * 2),
        fontSize: 48,
        fontWeight: 'bold',
        fill: '#000000',
        textAlign: 'center',
        originX: 'center',
        originY: 'center',
        lineHeight: 1.3,
      })
      pageCanvas.add(titleText)

      // Subtitle if available
      if (outline.subtitle) {
        const subtitleText = new fabric.Textbox(outline.subtitle, {
          left: pageWidth / 2,
          top: pageHeight / 2 + 80,
          width: pageWidth - (pageMargin * 2),
          fontSize: 24,
          fill: '#666666',
          textAlign: 'center',
          originX: 'center',
          originY: 'center',
          lineHeight: 1.4,
        })
        pageCanvas.add(subtitleText)
      }

      pageCanvas.renderAll()
      return pageCanvas
    }

    // Helper function to create author page
    const createAuthorPage = (): fabric.Canvas => {
      const pageCanvas = createNewPage()
      const author = authorName || 'Anonymous Author'

      const authorText = new fabric.Textbox(`By ${author}`, {
        left: pageWidth / 2,
        top: pageHeight / 2,
        width: pageWidth - (pageMargin * 2),
        fontSize: 18,
        fill: '#000000',
        textAlign: 'center',
        originX: 'center',
        originY: 'center',
        lineHeight: 1.5,
      })
      pageCanvas.add(authorText)

      pageCanvas.renderAll()
      return pageCanvas
    }

    // Helper function to create copyright page
    const createCopyrightPage = (): fabric.Canvas => {
      const pageCanvas = createNewPage()
      const author = authorName || 'Anonymous Author'
      const currentYear = new Date().getFullYear()

      // Copyright heading
      const copyrightHeading = new fabric.Textbox('Copyright', {
        left: pageWidth / 2,
        top: pageHeight / 2 - 200,
        width: pageWidth - (pageMargin * 2),
        fontSize: 28,
        fontWeight: 'bold',
        fill: '#000000',
        textAlign: 'center',
        originX: 'center',
        originY: 'center',
      })
      pageCanvas.add(copyrightHeading)

      // Copyright text
      const copyrightText = `Copyright © ${currentYear} ${author}\n\n` +
        `This is a work of fiction. Names, characters, places, and incidents either ` +
        `are the product of the author's imagination or are used fictitiously.\n\n` +
        `Any resemblance to actual events, locales, or persons, living or dead, is ` +
        `entirely coincidental.\n\n` +
        `All rights reserved.\n\n` +
        `For permissions, contact support@yourplatform.com`

      const copyrightContent = new fabric.Textbox(copyrightText, {
        left: pageWidth / 2,
        top: pageHeight / 2,
        width: pageWidth - (pageMargin * 2),
        fontSize: 12,
        fill: '#333333',
        textAlign: 'center',
        originX: 'center',
        originY: 'center',
        lineHeight: 1.6,
      })
      pageCanvas.add(copyrightContent)

      pageCanvas.renderAll()
      return pageCanvas
    }

    // Helper function to finalize and save a front matter page (title, author, copyright)
    const finalizeFrontMatterPage = (pageCanvas: fabric.Canvas, pageName: string, includePageNumber: boolean = false): void => {
      if (includePageNumber) {
        const pageNumber = new fabric.Text(`${newPages.length + 1}`, {
          left: pageWidth / 2,
          top: pageHeight - 30,
          fontSize: 12,
          fill: '#666666',
          originX: 'center',
          selectable: false,
        })
        pageCanvas.add(pageNumber)
      }

      pageCanvas.renderAll()

      const pageData = pageCanvas.toJSON()
      newPages.push({
        id: `front-matter-${pageName.toLowerCase().replace(/\s+/g, '-')}`,
        name: pageName,
        data: pageData,
      })
    }

    // Helper function to finalize and save a page
    const finalizePage = (pageCanvas: fabric.Canvas, pageNum: number, chapterNum: number, pageIndex: number, isFirstPage: boolean): string => {
      // Add page number at bottom
      const pageNumber = new fabric.Text(`${pageNum}`, {
        left: pageWidth / 2,
        top: pageHeight - 30,
        fontSize: 12,
        fill: '#666666',
        originX: 'center',
        selectable: false,
      })
      pageCanvas.add(pageNumber)

      pageCanvas.renderAll()

      // Generate page name
      const pageName = isFirstPage
        ? `Ch ${chapterNum} Page ${pageIndex + 1}: ${outline.chapters.find((ch: any) => ch.number === chapterNum)?.title.substring(0, 15) || ''}...`
        : `Ch ${chapterNum} Page ${pageIndex + 1}`

      const pageData = pageCanvas.toJSON()
      newPages.push({
        id: `chapter-${chapterNum}-page-${pageIndex}`,
        name: pageName,
        data: pageData,
      })

      return pageCanvas.toDataURL() // Return for debugging if needed
    }

    // Helper function to calculate text height accurately
    const calculateTextHeight = (text: string, width: number, fontSize: number, lineHeight: number): number => {
      // Create a temporary canvas and textbox to get accurate measurements
      const tempCanvasEl = document.createElement('canvas')
      const tempCanvas = new fabric.Canvas(tempCanvasEl, {
        width: width,
        height: 2000, // Large height for accurate measurement
        backgroundColor: '#ffffff',
      })

      const tempText = new fabric.Textbox(text, {
        left: 0,
        top: 0,
        width: width,
        fontSize: fontSize,
        lineHeight: lineHeight,
        fill: '#000000',
      })

      tempCanvas.add(tempText)
      tempCanvas.renderAll()

      // Get the calculated height
      const height = tempText.height || fontSize * lineHeight

      // Clean up
      tempCanvas.dispose()

      return height
    }

    // Add front matter pages (Title, Author, Copyright)
    // Title page (no page number)
    const titlePage = createTitlePage()
    finalizeFrontMatterPage(titlePage, 'Title Page', false)

    // Author page (no page number)
    const authorPage = createAuthorPage()
    finalizeFrontMatterPage(authorPage, 'Author Page', false)

    // Copyright page (no page number)
    const copyrightPage = createCopyrightPage()
    finalizeFrontMatterPage(copyrightPage, 'Copyright', false)

    // Global page counter for main content (starts after front matter)
    let globalPageNumber = 1

    // Helper function to process a section (prologue/epilogue) similar to chapters
    const processSection = (sectionTitle: string, sectionContent: string | null, sectionType: 'prologue' | 'epilogue') => {
      if (!fabricCanvas) {
        console.error('[Canvas] Canvas not ready for', sectionType)
        return
      }

      let currentPageCanvas: fabric.Canvas | null = null
      let currentPageIndex = 0
      let yPosition = pageMargin

      const startNewPage = () => {
        if (currentPageCanvas && yPosition > pageMargin) {
          // Finalize previous page
          const canvas = currentPageCanvas as fabric.Canvas
          const pageData = canvas.toJSON()
          const pageName = currentPageIndex === 1
            ? `${sectionType === 'prologue' ? 'Prologue' : 'Epilogue'}: ${sectionTitle.substring(0, 20)}...`
            : `${sectionType === 'prologue' ? 'Prologue' : 'Epilogue'} Page ${currentPageIndex}`

          // Add page number
          const pageNumber = new fabric.Text(`${globalPageNumber++}`, {
            left: pageWidth / 2,
            top: pageHeight - 30,
            fontSize: 12,
            fill: '#666666',
            originX: 'center',
            selectable: false,
          })
          canvas.add(pageNumber)
          canvas.renderAll()

          newPages.push({
            id: `${sectionType}-page-${currentPageIndex}`,
            name: pageName,
            data: pageData,
          })
        }

        currentPageCanvas = createNewPage()
        currentPageIndex++
        yPosition = pageMargin

        // Add section title on first page
        if (currentPageIndex === 1) {
          const titleText = new fabric.Textbox(sectionTitle, {
            left: pageMargin,
            top: yPosition,
            width: contentWidth,
            fontSize: 32,
            fontWeight: 'bold',
            fill: '#000000',
            lineHeight: 1.2,
          })
          const canvas = currentPageCanvas as fabric.Canvas
          canvas.add(titleText)
          yPosition += titleText.height! + 32 // Optimized spacing after section title
        }
      }

      // Start first page
      startNewPage()

      if (sectionContent) {
        // Clean markdown formatting from content
        const cleanedContent = stripMarkdown(sectionContent)
        const contentParagraphs = cleanedContent.split('\n\n').filter(p => p.trim())

        for (const paragraph of contentParagraphs) {
          if (!paragraph.trim()) continue

          const textHeight = calculateTextHeight(
            paragraph.trim(),
            contentWidth,
            14,
            1.65 // Optimized line height for better page fill
          )

          const paragraphSpacing = 16
          const requiredHeight = textHeight + paragraphSpacing

          if (yPosition + requiredHeight > maxContentHeight) {
            startNewPage()
          }

          if (currentPageCanvas) {
            const text = new fabric.Textbox(paragraph.trim(), {
              left: pageMargin,
              top: yPosition,
              width: contentWidth,
              fontSize: 14,
              fill: '#333333',
              lineHeight: 1.65,
              textAlign: 'justify',
            })
            const canvas = currentPageCanvas as fabric.Canvas
            canvas.add(text)
            yPosition += textHeight + paragraphSpacing
          }
        }
      } else {
        // Placeholder for not yet generated content
        if (currentPageCanvas) {
          const placeholder = new fabric.Textbox(
            `📝 ${sectionType === 'prologue' ? 'Prologue' : 'Epilogue'} content is being generated...`,
            {
              left: pageMargin,
              top: yPosition,
              width: contentWidth,
              fontSize: 16,
              fill: '#94a3b8',
              lineHeight: 1.6,
              fontStyle: 'italic',
            }
          )
          const canvas = currentPageCanvas as fabric.Canvas
          canvas.add(placeholder)
        }
      }

      // Finalize last page
      if (currentPageCanvas) {
        const canvas = currentPageCanvas as fabric.Canvas
        const pageData = canvas.toJSON()
        const pageName = currentPageIndex === 1
          ? `${sectionType === 'prologue' ? 'Prologue' : 'Epilogue'}: ${sectionTitle.substring(0, 20)}...`
          : `${sectionType === 'prologue' ? 'Prologue' : 'Epilogue'} Page ${currentPageIndex}`

        // Add page number
        const pageNumber = new fabric.Text(`${globalPageNumber++}`, {
          left: pageWidth / 2,
          top: pageHeight - 30,
          fontSize: 12,
          fill: '#666666',
          originX: 'center',
          selectable: false,
        })
        canvas.add(pageNumber)
        canvas.renderAll()

        newPages.push({
          id: `${sectionType}-page-${currentPageIndex}`,
          name: pageName,
          data: pageData,
        })
      }
    }

    // Process prologue if it exists
    if (outline.prologue && outline.prologue.description) {
      const prologueContent = (initialContent as any)?.generatedPrologue || null
      const prologueTitle = outline.prologue.title || 'Prologue'
      processSection(prologueTitle, prologueContent, 'prologue')
    }

    // Process each chapter
    if (outline.chapters && Array.isArray(outline.chapters)) {
      outline.chapters.forEach((chapter: any) => {
        if (!fabricCanvas) {
          console.error('[Canvas] Canvas not ready for chapter', chapter.number)
          return
        }

        // Check if this chapter has been generated
        const chapterContent = generatedChapters[chapter.number]

        if (!chapterContent) {
          // Chapter not yet generated - show placeholder on one page
          try {
            const pageCanvas = createNewPage()
            let yPosition = pageMargin

            // Chapter title
            const chapterTitle = new fabric.Textbox(`Chapter ${chapter.number}: ${chapter.title}`, {
              left: pageMargin,
              top: yPosition,
              width: contentWidth,
              fontSize: 32,
              fontWeight: 'bold',
              fill: '#000000',
              lineHeight: 1.2,
            })
            pageCanvas.add(chapterTitle)
            yPosition += chapterTitle.height! + 30

            // Placeholder text
            const placeholder = new fabric.Textbox(
              `📝 Generating chapter content...\n\n${chapter.description || 'This chapter is being written by AI. Please wait.'}`,
              {
                left: pageMargin,
                top: yPosition,
                width: contentWidth,
                fontSize: 16,
                fill: '#94a3b8',
                lineHeight: 1.6,
                fontStyle: 'italic',
              }
            )
            pageCanvas.add(placeholder)

            finalizePage(pageCanvas, globalPageNumber++, chapter.number, 0, true)
          } catch (error) {
            console.error('[Canvas] Error creating placeholder page for chapter', chapter.number, error)
          }
          return
        }

        // Chapter has been generated - process content across multiple pages
        // Clean markdown formatting from content
        const cleanedContent = stripMarkdown(chapterContent)
        const contentParagraphs = cleanedContent.split('\n\n').filter(p => p.trim())
        let currentPageCanvas: fabric.Canvas | null = null
        let currentPageIndex = 0
        let yPosition = pageMargin
        let isFirstPageOfChapter = true

        // Function to start a new page for the current chapter
        const startNewPage = () => {
          if (currentPageCanvas && yPosition > pageMargin) {
            // Finalize the previous page
            finalizePage(currentPageCanvas, globalPageNumber++, chapter.number, currentPageIndex, isFirstPageOfChapter)
          }

          // Create new page
          currentPageCanvas = createNewPage()
          currentPageIndex++
          yPosition = pageMargin

          // Add chapter title only on first page
          if (isFirstPageOfChapter) {
            const chapterTitle = new fabric.Textbox(`Chapter ${chapter.number}: ${chapter.title}`, {
              left: pageMargin,
              top: yPosition,
              width: contentWidth,
              fontSize: 32,
              fontWeight: 'bold',
              fill: '#000000',
              lineHeight: 1.2,
            })
            const canvas = currentPageCanvas as fabric.Canvas
            canvas.add(chapterTitle)
            yPosition += chapterTitle.height! + 32 // Optimized spacing after title
            isFirstPageOfChapter = false
          }
        }

        // Start the first page
        startNewPage()

        // Process each paragraph
        for (const paragraph of contentParagraphs) {
          if (!paragraph.trim()) continue

          // Calculate text height before adding
          const textHeight = calculateTextHeight(
            paragraph.trim(),
            contentWidth,
            14, // fontSize
            1.65 // lineHeight - optimized for better page fill
          )

          const paragraphSpacing = 16
          const requiredHeight = textHeight + paragraphSpacing

          // Check if we need a new page
          if (yPosition + requiredHeight > maxContentHeight) {
            // Current paragraph doesn't fit, start new page
            startNewPage()
          }

          // Add the paragraph to current page
          if (currentPageCanvas) {
            const text = new fabric.Textbox(paragraph.trim(), {
              left: pageMargin,
              top: yPosition,
              width: contentWidth,
              fontSize: 14,
              fill: '#333333',
              lineHeight: 1.65,
              textAlign: 'justify',
            })
            const canvas = currentPageCanvas as fabric.Canvas
            canvas.add(text)
            yPosition += textHeight + paragraphSpacing
          }
        }

        // Finalize the last page of this chapter
        if (currentPageCanvas) {
          finalizePage(currentPageCanvas, globalPageNumber++, chapter.number, currentPageIndex, isFirstPageOfChapter)
        }
      })
    }

    // Process epilogue if it exists
    if (outline.epilogue && outline.epilogue.description) {
      const epilogueContent = (initialContent as any)?.generatedEpilogue || null
      const epilogueTitle = outline.epilogue.title || 'Epilogue'
      processSection(epilogueTitle, epilogueContent, 'epilogue')
    }

    setPages(newPages)
    setCurrentPage(0)

    // Generate previews for all pages
    newPages.forEach((page, index) => {
      if (page.data) {
        // Use page.id or create a unique ID if not available
        const pageId = page.id || `page-${index}`
        generatePagePreview(page.data, pageId)
      }
    })

    // Auto-save after a short delay (page loading will be handled by useEffect)
    setTimeout(() => {
      onSave({
        pages: newPages,
        settings: {
          width: 800,
          height: 1000,
          backgroundColor: '#ffffff',
        },
      })
    }, 500)
  }

  const initializeFromGeneratedContent = (fabricCanvas: fabric.Canvas, content: any) => {
    const newPages: any[] = []

    // Create chapter pages directly (no cover page)
    if (content.chapters && Array.isArray(content.chapters)) {
      content.chapters.forEach((chapter: any, index: number) => {
        // Verify canvas is still valid for each chapter
        if (!fabricCanvas) {
          console.error('[Canvas] Canvas not ready for chapter', index)
          return
        }

        try {
          // Create new canvas for this chapter
          fabricCanvas.backgroundColor = '#ffffff'
          fabricCanvas.clear()
        } catch (error) {
          console.error('[Canvas] Error clearing canvas for chapter', index, error)
          return
        }

        const pageMargin = 40
        const pageWidth = 595 // A4 width
        const pageHeight = 842 // A4 height
        const contentWidth = pageWidth - (pageMargin * 2)
        const maxContentHeight = pageHeight - pageMargin
        let yPosition = pageMargin

        // Chapter title
        const chapterTitle = new fabric.Textbox(`Chapter ${chapter.number}: ${chapter.title}`, {
          left: pageMargin,
          top: yPosition,
          width: contentWidth,
          fontSize: 32,
          fontWeight: 'bold',
          fill: '#000000',
          lineHeight: 1.2,
        })
        fabricCanvas.add(chapterTitle)
        yPosition += chapterTitle.height! + 30

        // Introduction
        if (chapter.introduction) {
          const intro = new fabric.Textbox(chapter.introduction, {
            left: pageMargin,
            top: yPosition,
            width: contentWidth,
            fontSize: 16,
            fill: '#333333',
            lineHeight: 1.65,
            textAlign: 'justify',
          })
          const introHeight = intro.height || 100
          if (yPosition + introHeight <= maxContentHeight) {
            fabricCanvas.add(intro)
            yPosition += introHeight + 18
          }
        }

        // Content paragraphs - add until we run out of space
        if (chapter.content && Array.isArray(chapter.content)) {
          for (const paragraph of chapter.content) {
            if (!paragraph.trim()) continue

            const text = new fabric.Textbox(paragraph, {
              left: pageMargin,
              top: yPosition,
              width: contentWidth,
              fontSize: 14,
              fill: '#333333',
              lineHeight: 1.65,
              textAlign: 'justify',
            })

            const textHeight = text.height || 100
            if (yPosition + textHeight > maxContentHeight) {
              break
            }

            fabricCanvas.add(text)
            yPosition += textHeight + 16
          }
        }

        // Add page number at bottom
        const pageNumber = new fabric.Text(`${index + 1}`, {
          left: pageWidth / 2,
          top: pageHeight - 40,
          fontSize: 12,
          fill: '#666666',
          originX: 'center',
          selectable: false,
        })
        fabricCanvas.add(pageNumber)

        fabricCanvas.renderAll()

        const chapterPage = {
          id: `chapter-${index}`,
          name: `Ch ${chapter.number}: ${chapter.title.substring(0, 20)}...`,
          data: fabricCanvas.toJSON(),
        }
        newPages.push(chapterPage)
      })
    }

    setPages(newPages)
    setCurrentPage(0)

    // Auto-save after a short delay (page loading will be handled by useEffect)
    setTimeout(() => {
      onSave({
        pages: newPages,
        settings: {
          width: 800,
          height: 1000,
          backgroundColor: '#ffffff',
        },
      })
    }, 500)
  }

  const loadPage = (fabricCanvas: fabric.Canvas, page: any, attempt = 0) => {
    if (!fabricCanvas) {
      console.error('[Canvas] Canvas not ready for page load')
      return
    }

    const MAX_ATTEMPTS = 10
    const RETRY_DELAY = 150

    // Check if canvas element is ready - check both lowerCanvasEl and the canvas ref
    const canvasElement = fabricCanvas.lowerCanvasEl || canvasRef.current
    if (!canvasElement || !canvasElement.getContext) {
      if (attempt < MAX_ATTEMPTS) {
        if (attempt < 3) {
          // Only log first few attempts to reduce console noise
          console.warn(`[Canvas] Canvas element not ready (attempt ${attempt + 1}/${MAX_ATTEMPTS}), retrying...`)
        }
        setTimeout(() => loadPage(fabricCanvas, page, attempt + 1), RETRY_DELAY * (attempt + 1))
      } else {
        // Only log error if we've exhausted all retries
        console.error('[Canvas] Canvas element not ready for page load after retries')
      }
      return
    }

    console.log('[Canvas] Loading page:', page?.name || 'Unknown')

    try {
      // Reset current selection and clear existing objects
      fabricCanvas.discardActiveObject()

      // Safely clear the canvas - remove all objects manually if clear() fails
      try {
        fabricCanvas.clear()
      } catch (clearError) {
        // If clear() fails, manually remove all objects
        const objects = fabricCanvas.getObjects()
        objects.forEach(obj => fabricCanvas.remove(obj))
      }

      fabricCanvas.backgroundColor = '#ffffff'

      if (page?.data) {
        console.log('[Canvas] Loading page data from JSON')
        fabricCanvas.loadFromJSON(page.data, () => {
          console.log('[Canvas] Page data loaded successfully')
          fabricCanvas.renderAll()
          fabricCanvas.requestRenderAll()
        })
      } else {
        console.log('[Canvas] No page data, showing blank page')
        fabricCanvas.renderAll()
        fabricCanvas.requestRenderAll()
      }
    } catch (error) {
      console.error('[Canvas] Error in loadPage:', error)
    }
  }

  const savePage = () => {
    if (!canvas || pages.length === 0) return

    const updatedPages = [...pages]
    updatedPages[currentPage].data = canvas.toJSON()
    setPages(updatedPages)

    // Save to parent
    onSave({
      pages: updatedPages,
      settings: {
        width: 800,
        height: 1000,
        backgroundColor: '#ffffff',
      },
    })
  }

  const changePage = (index: number) => {
    if (!canvas) {
      console.log('[Canvas] No canvas available for page change')
      return
    }

    console.log(`[Canvas] Changing from page ${currentPage} to page ${index}`)

    // Save current page before switching
    if (pages.length > 0 && currentPage >= 0 && currentPage < pages.length) {
      const updatedPages = [...pages]
      updatedPages[currentPage] = { ...updatedPages[currentPage], data: canvas.toJSON() }
      setPages(updatedPages)
    }

    // Update the current page index
    setCurrentPage(index)

    // Force immediate page load
    setTimeout(() => {
      if (pages[index]) {
        console.log(`[Canvas] Loading page ${index + 1} immediately`)
        loadPage(canvas, pages[index])
      }
    }, 10)
  }

  const addText = () => {
    if (!canvas) return

    const text = new fabric.Textbox('Double click to edit', {
      left: 100,
      top: 100,
      width: 600,
      fontSize: fontSize,
      fontFamily: fontFamily,
      fill: textColor,
    })

    canvas.add(text)
    canvas.setActiveObject(text)
    canvas.renderAll()
    saveHistory()
  }

  const addHeading = () => {
    if (!canvas) return

    const heading = new fabric.Textbox('Chapter Title', {
      left: 100,
      top: 100,
      width: 600,
      fontSize: fontSize * 1.5,
      fontFamily: fontFamily,
      fill: textColor,
      fontWeight: 'bold',
    })

    canvas.add(heading)
    canvas.setActiveObject(heading)
    canvas.renderAll()
    saveHistory()
  }

  const deleteSelected = () => {
    if (!canvas || !selectedObject) return
    canvas.remove(selectedObject)
    canvas.renderAll()
    setSelectedObject(null)
    saveHistory()
  }

  // Text formatting functions
  const toggleBold = () => {
    if (!canvas || !selectedObject) return
    const text = selectedObject as fabric.Textbox
    text.set('fontWeight', text.fontWeight === 'bold' ? 'normal' : 'bold')
    canvas.renderAll()
    saveHistory()
  }

  const toggleItalic = () => {
    if (!canvas || !selectedObject) return
    const text = selectedObject as fabric.Textbox
    text.set('fontStyle', text.fontStyle === 'italic' ? 'normal' : 'italic')
    canvas.renderAll()
    saveHistory()
  }

  const toggleUnderline = () => {
    if (!canvas || !selectedObject) return
    const text = selectedObject as fabric.Textbox
    text.set('underline', !text.underline)
    canvas.renderAll()
    saveHistory()
  }

  const changeFontSize = (newSize: number) => {
    if (!canvas || !selectedObject) return
    const text = selectedObject as fabric.Textbox
    text.set('fontSize', newSize)
    canvas.renderAll()
    saveHistory()
  }

  const changeTextColor = (color: string) => {
    if (!canvas || !selectedObject) return
    const text = selectedObject as fabric.Textbox
    text.set('fill', color)
    canvas.renderAll()
    saveHistory()
  }

  const changeTextAlign = (align: string) => {
    if (!canvas || !selectedObject || selectedObject.type !== 'textbox') return
    (selectedObject as fabric.Textbox).set('textAlign', align)
    canvas.renderAll()
    saveHistory()
  }

  const changeFontFamily = (font: string) => {
    if (!canvas || !selectedObject || selectedObject.type !== 'textbox') return
    (selectedObject as fabric.Textbox).set('fontFamily', font)
    canvas.renderAll()
  }

  const changeBackgroundColor = (color: string) => {
    if (!canvas || !selectedObject || selectedObject.type !== 'textbox') return
    (selectedObject as fabric.Textbox).set('textBackgroundColor', color)
    canvas.renderAll()
  }

  const bringToFront = () => {
    if (!canvas || !selectedObject) return
    ;(selectedObject as any).bringToFront()
    canvas.renderAll()
  }

  const sendToBack = () => {
    if (!canvas || !selectedObject) return
    ;(selectedObject as any).sendToBack()
    canvas.renderAll()
  }

  const addNewPage = () => {
    const newPage = {
      id: Date.now().toString(),
      name: `Page ${pages.length + 1}`,
      data: null,
    }
    setPages([...pages, newPage])
  }

  const deletePage = (pageIndex: number) => {
    if (pages.length <= 1) {
      // Don't allow deleting the last page
      alert('Cannot delete the last page. A book must have at least one page.')
      return
    }

    const pageToDelete = pages[pageIndex]
    if (!pageToDelete) return

    const updatedPages = pages.filter((_, index) => index !== pageIndex)
    setPages(updatedPages)

    // If we deleted the current page, navigate to a valid page
    if (currentPage >= updatedPages.length) {
      setCurrentPage(updatedPages.length - 1)
    } else if (currentPage > pageIndex) {
      // If we deleted a page before the current one, adjust the current page index
      setCurrentPage(currentPage - 1)
    }

    // Clear the page preview for the deleted page
    if (pageToDelete.id) {
      setPagePreviews(prev => {
        const newPreviews = { ...prev }
        delete newPreviews[pageToDelete.id]
        return newPreviews
      })
    }

    // Save the updated pages
    onSave({
      pages: updatedPages,
      settings: {
        width: 800,
        height: 1000,
        backgroundColor: '#ffffff',
      },
    })
  }

  const exportToPDF = async () => {
    if (!canvas || exporting) return

    setExporting(true)
    try {
      // Save current page first
      savePage()

      // Wait a bit for save to complete
      await new Promise(resolve => setTimeout(resolve, 100))

      // Get book title
      const title = bookTitle ||
        (initialContent as any)?.outline?.title ||
        'My Book'

      // Generate PDF
      const blob = await generatePDF(pages, title)

      // Download
      downloadPDF(blob, `${title}.pdf`)
    } catch (error) {
      console.error('Error exporting PDF:', error)
      alert('Failed to export PDF. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  const exportToDOCX = async () => {
    if (!canvas || exporting) return

    setExporting(true)
    try {
      // Save current page first
      savePage()

      // Wait a bit for save to complete
      await new Promise(resolve => setTimeout(resolve, 100))

      // Get book title
      const title = bookTitle ||
        (initialContent as any)?.outline?.title ||
        'My Book'

      // Generate DOCX
      const blob = await generateDOCX(pages, title)

      // Download
      downloadDOCX(blob, title)
    } catch (error) {
      console.error('Error exporting DOCX:', error)
      alert('Failed to export DOCX. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  const toggleTools = () => {
    setShowTools(!showTools)
  }

  const togglePages = () => {
    setShowPages(!showPages)
  }

  // History functions for undo/redo
  const saveHistory = () => {
    if (!canvas) return

    const json = canvas.toJSON()

    setHistory(prevHistory => {
      // Remove any history after current step (when new action is performed)
      const newHistory = prevHistory.slice(0, historyStep + 1)

      // Limit history size to 50 entries to prevent memory issues
      if (newHistory.length >= 50) {
        newHistory.shift() // Remove oldest entry
      }

      newHistory.push(json)

      // Update history step
      setHistoryStep(newHistory.length - 1)

      return newHistory
    })
  }



  // Expose zoom level via event
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pothigpt-zoom-change', {
        detail: { zoomLevel }
      }))
    }
  }, [zoomLevel])

  // Image upload function
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !canvas) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string
      if (!dataUrl) return
      
      try {
        const img = await fabric.Image.fromURL(dataUrl)
        img.scaleToWidth(300)
        canvas.add(img)
        canvas.renderAll()
        saveHistory()
      } catch (error) {
        console.error('Error loading image:', error)
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <Box
      className="modern-editor"
      style={{
        height: '100vh',
        width: '100vw',
        position: 'fixed',
        top: 0,
        left: 0,
        background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)',
        overflow: 'hidden'
      }}
    >
      {/* Top Navigation Bar - Canva Style */}
      <Box
        style={{
          height: '64px',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          position: 'relative',
          zIndex: 100
        }}
      >
        <Flex
          align="center"
          justify="between"
          height="100%"
          px="4"
          gap="4"
          style={{ overflow: 'visible', width: '100%', minWidth: 0 }}
        >
          {/* Left Section - Logo & Page Info */}
          <Flex align="center" gap="2" style={{ flexShrink: 0, minWidth: 0 }} className="hidden sm:flex sm:gap-4">
            <Text size="3" weight="bold" className="sm:!text-lg md:!text-xl" style={{
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              📚 Editor
            </Text>
            <Separator orientation="vertical" size="2" className="hidden md:block" />
            <Badge size="1" color="blue" variant="soft" radius="full" className="hidden md:block md:!text-xs">
              Page {currentPage + 1} of {pages.length}
            </Badge>
          </Flex>

          {/* Center Section - Main Actions */}
          <Flex 
            align="center" 
            gap={{ initial: '1', sm: '2' }} 
            wrap="wrap"
            style={{ flex: '1 1 auto', justifyContent: 'center', minWidth: 0, overflow: 'hidden' }}
            className="px-1"
          >
            <Tooltip content="Undo (⌘Z)">
              <IconButton
                variant="soft"
                color="gray"
                size="2"
                className="sm:!w-8 sm:!h-8"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('pothigpt-undo'))
                  }
                }}
                disabled={historyStep <= 0}
                style={{ cursor: 'pointer' }}
              >
                <ResetIcon />
              </IconButton>
            </Tooltip>

            <Tooltip content="Redo (⌘⇧Z)">
              <IconButton
                variant="soft"
                color="gray"
                size="2"
                className="sm:!w-8 sm:!h-8"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('pothigpt-redo'))
                  }
                }}
                disabled={historyStep >= history.length - 1}
                style={{ cursor: 'pointer' }}
              >
                <MixIcon />
              </IconButton>
            </Tooltip>

            <Separator orientation="vertical" size="2" mx="1" className="hidden sm:block sm:!mx-2" />

            <Tooltip content="Add Text">
              <IconButton
                variant="soft"
                color="blue"
                size="2"
                className="sm:!w-8 sm:!h-8"
                onClick={addText}
                style={{ cursor: 'pointer' }}
              >
                <TextIcon />
              </IconButton>
            </Tooltip>

            <Tooltip content="Add Image">
              <IconButton
                variant="soft"
                color="green"
                size="2"
                className="sm:!w-8 sm:!h-8"
                onClick={() => document.getElementById('image-upload')?.click()}
                style={{ cursor: 'pointer' }}
              >
                <ImageIcon />
              </IconButton>
            </Tooltip>

            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
              id="image-upload"
            />

            {selectedObject && selectedObject.type === 'textbox' && (
              <>
                <Separator orientation="vertical" size="2" mx="2" />
                
                {/* Font Family */}
                <Select.Root
                  value={(selectedObject as fabric.Textbox).fontFamily || 'Arial'}
                  onValueChange={(value) => {
                    changeFontFamily(value)
                    setFontFamily(value)
                  }}
                >
                  <Select.Trigger 
                    variant="soft"
                    style={{ minWidth: '120px', cursor: 'pointer' }}
                    className="hidden sm:flex"
                  />
                  <Select.Content>
                    <Select.Item value="Arial">Arial</Select.Item>
                    <Select.Item value="Times New Roman">Times New Roman</Select.Item>
                    <Select.Item value="Georgia">Georgia</Select.Item>
                    <Select.Item value="Helvetica">Helvetica</Select.Item>
                    <Select.Item value="Courier New">Courier New</Select.Item>
                    <Select.Item value="Verdana">Verdana</Select.Item>
                    <Select.Item value="Comic Sans MS">Comic Sans MS</Select.Item>
                  </Select.Content>
                </Select.Root>

                {/* Font Size */}
                <Select.Root
                  value={String((selectedObject as fabric.Textbox).fontSize || 16)}
                  onValueChange={(value) => {
                    const size = parseInt(value)
                    changeFontSize(size)
                    setFontSize(size)
                  }}
                >
                  <Select.Trigger 
                    variant="soft"
                    style={{ minWidth: '70px', cursor: 'pointer' }}
                    className="hidden sm:flex"
                  />
                  <Select.Content>
                    {[8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 96, 120, 144].map(size => (
                      <Select.Item key={size} value={String(size)}>{size}px</Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>

                {/* Text Color */}
                <Tooltip content="Text Color">
                  <Box style={{ position: 'relative' }} className="hidden sm:block">
                    <input
                      type="color"
                      value={(selectedObject as fabric.Textbox).fill as string || '#000000'}
                      onChange={(e) => {
                        changeTextColor(e.target.value)
                        setTextColor(e.target.value)
                      }}
                      style={{
                        width: '32px',
                        height: '32px',
                        border: '1px solid #e0e7ff',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        padding: '2px',
                        backgroundColor: 'transparent'
                      }}
                    />
                  </Box>
                </Tooltip>

                {/* Text Alignment */}
                <Separator orientation="vertical" size="2" mx="1" className="hidden sm:block" />
                <Tooltip content="Align Left">
                  <IconButton
                    variant={(selectedObject as fabric.Textbox).textAlign === 'left' ? 'solid' : 'soft'}
                    color={(selectedObject as fabric.Textbox).textAlign === 'left' ? 'blue' : 'gray'}
                    size="2"
                    onClick={() => {
                      changeTextAlign('left')
                      setTextAlign('left')
                    }}
                    style={{ cursor: 'pointer' }}
                    className="hidden sm:flex"
                  >
                    <Text size="2" weight="bold">L</Text>
                  </IconButton>
                </Tooltip>
                <Tooltip content="Align Center">
                  <IconButton
                    variant={(selectedObject as fabric.Textbox).textAlign === 'center' ? 'solid' : 'soft'}
                    color={(selectedObject as fabric.Textbox).textAlign === 'center' ? 'blue' : 'gray'}
                    size="2"
                    onClick={() => {
                      changeTextAlign('center')
                      setTextAlign('center')
                    }}
                    style={{ cursor: 'pointer' }}
                    className="hidden sm:flex"
                  >
                    <Text size="2" weight="bold">C</Text>
                  </IconButton>
                </Tooltip>
                <Tooltip content="Align Right">
                  <IconButton
                    variant={(selectedObject as fabric.Textbox).textAlign === 'right' ? 'solid' : 'soft'}
                    color={(selectedObject as fabric.Textbox).textAlign === 'right' ? 'blue' : 'gray'}
                    size="2"
                    onClick={() => {
                      changeTextAlign('right')
                      setTextAlign('right')
                    }}
                    style={{ cursor: 'pointer' }}
                    className="hidden sm:flex"
                  >
                    <Text size="2" weight="bold">R</Text>
                  </IconButton>
                </Tooltip>

                {/* Bold, Italic, Underline */}
                <Separator orientation="vertical" size="2" mx="1" className="hidden sm:block" />
                <Tooltip content="Bold (⌘B)">
                  <IconButton
                    variant={(selectedObject as fabric.Textbox).fontWeight === 'bold' ? 'solid' : 'soft'}
                    color={(selectedObject as fabric.Textbox).fontWeight === 'bold' ? 'blue' : 'gray'}
                    size="2"
                    onClick={toggleBold}
                    style={{ cursor: 'pointer' }}
                    className="hidden sm:flex"
                  >
                    <FontBoldIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip content="Italic (⌘I)">
                  <IconButton
                    variant={(selectedObject as fabric.Textbox).fontStyle === 'italic' ? 'solid' : 'soft'}
                    color={(selectedObject as fabric.Textbox).fontStyle === 'italic' ? 'blue' : 'gray'}
                    size="2"
                    onClick={toggleItalic}
                    style={{ cursor: 'pointer' }}
                    className="hidden sm:flex"
                  >
                    <FontItalicIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip content="Underline (⌘U)">
                  <IconButton
                    variant={(selectedObject as fabric.Textbox).underline ? 'solid' : 'soft'}
                    color={(selectedObject as fabric.Textbox).underline ? 'blue' : 'gray'}
                    size="2"
                    onClick={toggleUnderline}
                    style={{ cursor: 'pointer' }}
                    className="hidden sm:flex"
                  >
                    <UnderlineIcon />
                  </IconButton>
                </Tooltip>

                <Separator orientation="vertical" size="2" mx="2" />
                <Tooltip content="Delete (Del)">
                  <IconButton
                    variant="soft"
                    color="red"
                    size="3"
                    onClick={deleteSelected}
                    style={{ cursor: 'pointer' }}
                  >
                    <TrashIcon />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Flex>

          {/* Right Section - Save & Export */}
          <Flex
            align="center"
            gap={{ initial: '1', sm: '2' }}
            style={{
              flexShrink: 0,
              flexGrow: 0,
              minWidth: 'fit-content',
              zIndex: 10,
              position: 'relative',
              visibility: 'visible',
              display: 'flex',
              opacity: 1
            }}
          >
            <RadixButton
              variant="soft"
              color="gray"
              size="2"
              onClick={savePage}
              style={{ cursor: 'pointer', flexShrink: 0 }}
              disabled={exporting}
              className="hidden sm:flex"
            >
              Save
            </RadixButton>
            <RadixButton
              variant="solid"
              color="blue"
              size="2"
              className="sm:!h-8 sm:!px-3"
              onClick={exportToPDF}
              style={{
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                flexShrink: 0,
                minWidth: 'fit-content'
              }}
              disabled={exporting}
            >
              <DownloadIcon width="14" height="14" className="sm:!w-4 sm:!h-4" style={{ marginRight: '4px' }} />
              <Text size="1" className="hidden sm:inline sm:!text-sm">PDF</Text>
            </RadixButton>
            <RadixButton
              variant="solid"
              color="green"
              size="2"
              className="sm:!h-8 sm:!px-3"
              onClick={exportToDOCX}
              style={{
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                flexShrink: 0,
                minWidth: 'fit-content'
              }}
              disabled={exporting}
            >
              <DownloadIcon width="14" height="14" className="sm:!w-4 sm:!h-4" style={{ marginRight: '4px' }} />
              <Text size="1" className="hidden sm:inline sm:!text-sm">DOCX</Text>
            </RadixButton>
          </Flex>
        </Flex>
      </Box>

      {/* Chapter Generation Progress Banner */}
      {generatingChapters && currentGeneratingChapter && (
        <Box
          style={{
            background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
            border: '2px solid #3b82f6',
            borderRadius: '12px',
            padding: '1rem 1.5rem',
            margin: '0 16px 16px 16px',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)',
            zIndex: 99,
            position: 'relative'
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
            {chapters.length > 0 && (
              <Flex gap="2" wrap="wrap">
                {chapters.map((ch: any) => (
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
            )}
          </Flex>
        </Box>
      )}

      {/* Main Content Area */}
      <Flex style={{ height: generatingChapters && currentGeneratingChapter ? 'calc(100vh - 64px - 140px)' : 'calc(100vh - 64px)', position: 'relative' }}>
        {/* Left Sidebar - Tools Panel */}
        <Box
          style={{
            width: showTools ? '320px' : '0',
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(12px)',
            borderRight: showTools ? '1px solid rgba(226, 232, 240, 0.8)' : 'none',
            boxShadow: showTools ? '2px 0 12px rgba(0, 0, 0, 0.04)' : 'none',
            position: 'relative',
            zIndex: 50
          }}
        >
          {showTools && (
            <Flex direction="column" height="100%" p="4" gap="4">
              <Flex align="center" justify="between">
                <Text size="4" weight="bold" style={{ color: '#1e293b' }}>
                  Design Tools
                </Text>
                <IconButton
                  variant="ghost"
                  color="gray"
                  size="2"
                  onClick={toggleTools}
                  style={{ cursor: 'pointer' }}
                >
                  <Cross2Icon />
                </IconButton>
              </Flex>

              <ScrollArea style={{ height: '100%' }}>
                <Flex direction="column" gap="4" pr="2">
                  {/* Elements Section */}
                  <Box>
                    <Text size="2" weight="bold" mb="3" style={{ color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Elements
                    </Text>
                    <Grid columns="2" gap="2">
                      <Card
                        className="hover-lift-subtle"
                        style={{
                          padding: '16px',
                          cursor: 'pointer',
                          border: '1px solid #e2e8f0',
                          transition: 'all 0.2s ease'
                        }}
                        onClick={addHeading}
                      >
                        <Flex direction="column" align="center" gap="2">
                          <Box style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '24px'
                          }}>
                            📝
                          </Box>
                          <Text size="2" weight="medium">Heading</Text>
                        </Flex>
                      </Card>

                      <Card
                        className="hover-lift-subtle"
                        style={{
                          padding: '16px',
                          cursor: 'pointer',
                          border: '1px solid #e2e8f0',
                          transition: 'all 0.2s ease'
                        }}
                        onClick={addText}
                      >
                        <Flex direction="column" align="center" gap="2">
                          <Box style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '24px'
                          }}>
                            📄
                          </Box>
                          <Text size="2" weight="medium">Text</Text>
                        </Flex>
                      </Card>

                      <Card
                        className="hover-lift-subtle"
                        style={{
                          padding: '16px',
                          cursor: 'pointer',
                          border: '1px solid #e2e8f0',
                          transition: 'all 0.2s ease'
                        }}
                        onClick={() => document.getElementById('image-upload')?.click()}
                      >
                        <Flex direction="column" align="center" gap="2">
                          <Box style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '24px'
                          }}>
                            🖼️
                          </Box>
                          <Text size="2" weight="medium">Image</Text>
                        </Flex>
                      </Card>

                      <Card
                        className="hover-lift-subtle"
                        style={{
                          padding: '16px',
                          cursor: 'pointer',
                          border: '1px solid #e2e8f0',
                          transition: 'all 0.2s ease',
                          opacity: 0.5
                        }}
                      >
                        <Flex direction="column" align="center" gap="2">
                          <Box style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #fce7f3, #fbcfe8)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '24px'
                          }}>
                            🎨
                          </Box>
                          <Text size="2" weight="medium">Shape</Text>
                        </Flex>
                      </Card>
                    </Grid>
                  </Box>

                  {/* Text Formatting - Only show when text is selected */}
                  {selectedObject && selectedObject.type === 'textbox' && (
                    <>
                      <Separator size="4" />
                      <Box>
                        <Text size="2" weight="bold" mb="3" style={{ color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Text Formatting
                        </Text>

                        <Flex direction="column" gap="3">
                          {/* Font Family */}
                          <Box>
                            <Text size="1" weight="medium" mb="2" style={{ color: '#64748b' }}>
                              Font Family
                            </Text>
                            <Select.Root
                              value={(selectedObject as fabric.Textbox).fontFamily || 'Arial'}
                              onValueChange={changeFontFamily}
                            >
                              <Select.Trigger style={{ width: '100%' }} />
                              <Select.Content>
                                <Select.Item value="Arial">Arial</Select.Item>
                                <Select.Item value="Times New Roman">Times New Roman</Select.Item>
                                <Select.Item value="Georgia">Georgia</Select.Item>
                                <Select.Item value="Verdana">Verdana</Select.Item>
                                <Select.Item value="Helvetica">Helvetica</Select.Item>
                                <Select.Item value="Courier New">Courier New</Select.Item>
                              </Select.Content>
                            </Select.Root>
                          </Box>

                          {/* Font Size */}
                          <Box>
                            <Flex justify="between" mb="2">
                              <Text size="1" weight="medium" style={{ color: '#64748b' }}>
                                Font Size
                              </Text>
                              <Text size="1" weight="bold" style={{ color: '#3b82f6' }}>
                                {(selectedObject as fabric.Textbox).fontSize || 24}px
                              </Text>
                            </Flex>
                            {(() => {
                              const currentSize = (selectedObject as fabric.Textbox).fontSize || 24
                              const minSize = 8
                              const maxSize = 120
                              const percentage = ((currentSize - minSize) / (maxSize - minSize)) * 100
                              return (
                                <input
                                  type="range"
                                  min={minSize}
                                  max={maxSize}
                                  step={1}
                                  value={currentSize}
                                  onChange={(e) => {
                                    const target = e.target as HTMLInputElement
                                    const value = Number(target.value)
                                    changeFontSize(value)
                                    // Update background gradient
                                    const min = Number(target.min)
                                    const max = Number(target.max)
                                    const newPercentage = ((value - min) / (max - min)) * 100
                                    target.style.background = `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${newPercentage}%, #e5e7eb ${newPercentage}%, #e5e7eb 100%)`
                                  }}
                                  style={{
                                    width: '100%',
                                    height: '6px',
                                    borderRadius: '9999px',
                                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`,
                                    outline: 'none',
                                    WebkitAppearance: 'none',
                                    appearance: 'none',
                                    cursor: 'pointer'
                                  }}
                                  className="font-size-slider"
                                />
                              )
                            })()}
                          </Box>

                          {/* Text Style Buttons */}
                          <Box>
                            <Text size="1" weight="medium" mb="2" style={{ color: '#64748b' }}>
                              Style
                            </Text>
                            <Grid columns="3" gap="2">
                              <Tooltip content="Bold">
                                <IconButton
                                  variant={(selectedObject as fabric.Textbox).fontWeight === 'bold' ? 'solid' : 'soft'}
                                  color={(selectedObject as fabric.Textbox).fontWeight === 'bold' ? 'blue' : 'gray'}
                                  size="3"
                                  onClick={toggleBold}
                                  style={{ cursor: 'pointer', width: '100%' }}
                                >
                                  <FontBoldIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip content="Italic">
                                <IconButton
                                  variant={(selectedObject as fabric.Textbox).fontStyle === 'italic' ? 'solid' : 'soft'}
                                  color={(selectedObject as fabric.Textbox).fontStyle === 'italic' ? 'blue' : 'gray'}
                                  size="3"
                                  onClick={toggleItalic}
                                  style={{ cursor: 'pointer', width: '100%' }}
                                >
                                  <FontItalicIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip content="Underline">
                                <IconButton
                                  variant={(selectedObject as fabric.Textbox).underline ? 'solid' : 'soft'}
                                  color={(selectedObject as fabric.Textbox).underline ? 'blue' : 'gray'}
                                  size="3"
                                  onClick={toggleUnderline}
                                  style={{ cursor: 'pointer', width: '100%' }}
                                >
                                  <UnderlineIcon />
                                </IconButton>
                              </Tooltip>
                            </Grid>
                          </Box>

                          {/* Text Alignment */}
                          <Box>
                            <Text size="1" weight="medium" mb="2" style={{ color: '#64748b' }}>
                              Alignment
                            </Text>
                            <Grid columns="3" gap="2">
                              <RadixButton
                                variant={(selectedObject as fabric.Textbox).textAlign === 'left' ? 'solid' : 'soft'}
                                color={(selectedObject as fabric.Textbox).textAlign === 'left' ? 'blue' : 'gray'}
                                size="2"
                                onClick={() => changeTextAlign('left')}
                                style={{ cursor: 'pointer' }}
                              >
                                Left
                              </RadixButton>
                              <RadixButton
                                variant={(selectedObject as fabric.Textbox).textAlign === 'center' ? 'solid' : 'soft'}
                                color={(selectedObject as fabric.Textbox).textAlign === 'center' ? 'blue' : 'gray'}
                                size="2"
                                onClick={() => changeTextAlign('center')}
                                style={{ cursor: 'pointer' }}
                              >
                                Center
                              </RadixButton>
                              <RadixButton
                                variant={(selectedObject as fabric.Textbox).textAlign === 'right' ? 'solid' : 'soft'}
                                color={(selectedObject as fabric.Textbox).textAlign === 'right' ? 'blue' : 'gray'}
                                size="2"
                                onClick={() => changeTextAlign('right')}
                                style={{ cursor: 'pointer' }}
                              >
                                Right
                              </RadixButton>
                            </Grid>
                          </Box>

                          {/* Color Picker */}
                          <Box>
                            <Text size="1" weight="medium" mb="2" style={{ color: '#64748b' }}>
                              Text Color
                            </Text>
                            <Grid columns="8" gap="2">
                              {[
                                '#000000', '#FFFFFF', '#3b82f6', '#8b5cf6', '#ef4444', '#10b981', '#f59e0b', '#ec4899'
                              ].map(color => (
                                <button
                                  key={color}
                                  onClick={() => changeTextColor(color)}
                                  style={{
                                    backgroundColor: color,
                                    width: '32px',
                                    height: '32px',
                                    border: (selectedObject as fabric.Textbox).fill === color ? '3px solid #3b82f6' : '2px solid #e2e8f0',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    boxShadow: color === '#FFFFFF' ? 'inset 0 0 0 1px #e2e8f0' : 'none'
                                  }}
                                  className="hover:scale-110"
                                  title={color}
                                />
                              ))}
                            </Grid>
                          </Box>
                        </Flex>
                      </Box>
                    </>
                  )}
                </Flex>
              </ScrollArea>
            </Flex>
          )}
        </Box>

        {/* Toggle Tools Button - Floating */}
        {!showTools && (
          <Box
            style={{
              position: 'absolute',
              left: '16px',
              top: '16px',
              zIndex: 60
            }}
          >
            <Tooltip content="Show Tools">
              <IconButton
                variant="solid"
                color="blue"
                size="3"
                onClick={toggleTools}
                style={{
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                }}
              >
                <MixIcon />
              </IconButton>
            </Tooltip>
          </Box>
        )}

        {/* Center Canvas Area */}
        <Box
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px',
            position: 'relative',
            overflow: 'auto'
          }}
        >
          <Card
            style={{
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.12)',
              border: '1px solid rgba(226, 232, 240, 0.8)',
              borderRadius: '12px',
              overflow: 'auto',
              background: '#ffffff',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '600px'
            }}
          >
            <canvas
              ref={canvasRef}
              style={{
                display: 'block',
                maxWidth: '100%',
                maxHeight: 'calc(100vh - 200px)'
              }}
            />
          </Card>
        </Box>

        {/* Right Sidebar - Pages Panel */}
        <Box
          style={{
            width: showPages ? '280px' : '0',
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(12px)',
            borderLeft: showPages ? '1px solid rgba(226, 232, 240, 0.8)' : 'none',
            boxShadow: showPages ? '-2px 0 12px rgba(0, 0, 0, 0.04)' : 'none',
            position: 'relative',
            zIndex: 50
          }}
        >
          {showPages && (
            <Flex direction="column" height="100%" p="4" gap="4">
              <Flex align="center" justify="between">
                <Text size="4" weight="bold" style={{ color: '#1e293b' }}>
                  Pages
                </Text>
                <IconButton
                  variant="ghost"
                  color="gray"
                  size="2"
                  onClick={() => {
                    setShowPages(false)
                    // If we're closing pages, we might want to show the toggle button
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <Cross2Icon />
                </IconButton>
              </Flex>

              <ScrollArea style={{ height: '100%' }}>
                <Flex direction="column" gap="2" pr="2">
                  {pages.map((page, index) => (
                    <Card
                      key={page.id}
                      onClick={() => changePage(index)}
                      style={{
                        padding: '12px',
                        cursor: 'pointer',
                        border: currentPage === index ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                        background: currentPage === index ? 'linear-gradient(135deg, #dbeafe, #e0e7ff)' : '#ffffff',
                        transition: 'all 0.2s ease',
                        position: 'relative'
                      }}
                      className="hover-lift-subtle"
                    >
                      <Flex direction="column" gap="2">
                        <Flex align="center" justify="between">
                          <Text
                            size="2"
                            weight="bold"
                            style={{
                              color: currentPage === index ? '#1e40af' : '#1e293b',
                              flex: 1,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              cursor: 'pointer'
                            }}
                          >
                            {page.name}
                          </Text>
                          <Flex align="center" gap="2">
                            <Badge
                              size="1"
                              color={currentPage === index ? 'blue' : 'gray'}
                              variant="solid"
                            >
                              {index + 1}
                            </Badge>
                            {pages.length > 1 && (
                              <Tooltip content="Delete Page">
                                <IconButton
                                  variant="ghost"
                                  color="red"
                                  size="1"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (confirm(`Are you sure you want to delete "${page.name}"?`)) {
                                      deletePage(index)
                                    }
                                  }}
                                  style={{
                                    cursor: 'pointer',
                                    opacity: 0.7,
                                    transition: 'opacity 0.2s ease'
                                  }}
                                  className="hover:opacity-100"
                                >
                                  <TrashIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Flex>
                        </Flex>
                        {/* Page Preview */}
                        <Box style={{
                          width: '100%',
                          height: '120px',
                          background: '#f8fafc',
                          borderRadius: '6px',
                          border: '1px solid #e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          overflow: 'hidden',
                          position: 'relative'
                        }}>
                          {page.data && pagePreviews[page.id] ? (
                            <img
                              src={pagePreviews[page.id]}
                              alt={`Preview of ${page.name}`}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                borderRadius: '6px'
                              }}
                              onError={(e) => {
                                // Fallback to text if image fails to load
                                e.currentTarget.style.display = 'none'
                                if (e.currentTarget.nextElementSibling) {
                                  (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex'
                                }
                              }}
                            />
                          ) : page.data ? (
                            <Box style={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: '#f1f5f9'
                            }}>
                              <Text size="1" style={{ color: '#64748b' }}>
                                Generating...
                              </Text>
                            </Box>
                          ) : null}
                          <Text
                            size="1"
                            style={{
                              color: '#94a3b8',
                              display: page.data ? 'none' : 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '100%',
                              height: '100%'
                            }}
                          >
                            Page Preview
                          </Text>
                        </Box>
                      </Flex>
                    </Card>
                  ))}
                </Flex>
              </ScrollArea>

              <RadixButton
                onClick={addNewPage}
                variant="solid"
                color="blue"
                size="3"
                style={{ cursor: 'pointer', width: '100%' }}
              >
                <PlusIcon style={{ marginRight: '6px' }} />
                Add New Page
              </RadixButton>
            </Flex>
          )}
        </Box>

        {/* Toggle Pages Button - Floating */}
        {!showPages && !showImagePanel && (
          <Box
            style={{
              position: 'absolute',
              right: '16px',
              top: '16px',
              zIndex: 60,
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <Tooltip content="Show Pages">
              <IconButton
                variant="solid"
                color="purple"
                size="3"
                onClick={togglePages}
                style={{
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
                }}
              >
                <LayersIcon />
              </IconButton>
            </Tooltip>

            <Tooltip content="AI Image Generator">
              <IconButton
                variant="solid"
                color="indigo"
                size="3"
                onClick={() => setShowImagePanel(true)}
                style={{
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                }}
              >
                <ImageIcon />
              </IconButton>
            </Tooltip>
          </Box>
        )}

        {/* Right Sidebar - Image Generation Panel */}
        <Box
          style={{
            width: showImagePanel ? '320px' : '0',
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(12px)',
            borderLeft: showImagePanel ? '1px solid rgba(226, 232, 240, 0.8)' : 'none',
            boxShadow: showImagePanel ? '-2px 0 12px rgba(0, 0, 0, 0.04)' : 'none',
            position: 'relative',
            zIndex: 50
          }}
        >
          {showImagePanel && (
            <Flex direction="column" height="100%" p="4" gap="4">
              <Flex align="center" justify="between">
                <Text size="4" weight="bold" style={{ color: '#1e293b' }}>
                  AI Images
                </Text>
                <IconButton
                  variant="ghost"
                  color="gray"
                  size="2"
                  onClick={() => setShowImagePanel(false)}
                  style={{ cursor: 'pointer' }}
                >
                  <Cross2Icon />
                </IconButton>
              </Flex>

              <ScrollArea style={{ height: '100%' }}>
                <Flex direction="column" gap="4" pr="2">
                  <Card style={{ padding: '12px', background: '#f8fafc' }}>
                    <Flex direction="column" gap="3">
                      <Text size="2" weight="bold">Generate New Image</Text>
                      <textarea
                        value={imagePrompt}
                        onChange={(e) => setImagePrompt(e.target.value)}
                        placeholder="Describe the image you want to generate..."
                        style={{
                          width: '100%',
                          minHeight: '80px',
                          padding: '8px',
                          borderRadius: '6px',
                          border: '1px solid #e2e8f0',
                          fontSize: '14px',
                          resize: 'vertical'
                        }}
                      />
                      <RadixButton
                        disabled={isGeneratingImage || !imagePrompt.trim()}
                        onClick={async () => {
                          if (!imagePrompt.trim()) return

                          setIsGeneratingImage(true)
                          try {
                            const result = await generateIdeogramImage({
                              prompt: imagePrompt,
                              aspectRatio: '11:18' // Book cover ratio
                            })

                            setGeneratedImages(prev => [result, ...prev])
                          } catch (error) {
                            console.error('Failed to generate image:', error)
                            alert('Failed to generate image. Please check your API key and try again.')
                          } finally {
                            setIsGeneratingImage(false)
                          }
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        {isGeneratingImage ? 'Generating...' : 'Generate Image'}
                      </RadixButton>
                    </Flex>
                  </Card>

                  <Separator size="4" />

                  <Text size="2" weight="bold" style={{ color: '#64748b' }}>
                    Generated Images
                  </Text>

                  {generatedImages.length === 0 ? (
                    <Flex align="center" justify="center" style={{ padding: '32px 0', color: '#94a3b8' }}>
                      <Text size="2">No images generated yet</Text>
                    </Flex>
                  ) : (
                    generatedImages.map((img, index) => (
                      <Card key={index} style={{ overflow: 'hidden' }}>
                        <Flex direction="column" gap="2">
                          <Box style={{ position: 'relative', aspectRatio: '11/18', background: '#f1f5f9' }}>
                            <img
                              src={img.url}
                              alt={img.prompt}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </Box>
                          <Text size="1" style={{ color: '#64748b', maxHeight: '40px', overflow: 'hidden' }}>
                            {img.prompt}
                          </Text>
                          <RadixButton
                            variant="soft"
                            onClick={async () => {
                              if (!canvas) return

                              try {
                                const dataUrl = await downloadImageAsDataUrl(img.url)

                                const imgObj = await fabric.Image.fromURL(dataUrl)

                                // Scale to fit page width with some margin
                                const pageWidth = 595
                                const margin = 40
                                const targetWidth = pageWidth - (margin * 2)
                                const scale = targetWidth / imgObj.width

                                imgObj.set({
                                  left: pageWidth / 2,
                                  top: margin,
                                  originX: 'center',
                                  originY: 'top',
                                  scaleX: scale,
                                  scaleY: scale
                                })

                                canvas.add(imgObj)
                                canvas.setActiveObject(imgObj)
                                canvas.renderAll()
                              } catch (error) {
                                console.error('Failed to add image to canvas:', error)
                                alert('Failed to add image to canvas')
                              }
                            }}
                            style={{ cursor: 'pointer', width: '100%' }}
                          >
                            Add to Canvas
                          </RadixButton>
                        </Flex>
                      </Card>
                    ))
                  )}
                </Flex>
              </ScrollArea>
            </Flex>
          )}
        </Box>

      </Flex >
    </Box >
  )
}

