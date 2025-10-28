'use client'

import React, { useEffect, useRef, useState } from 'react'
import * as fabric from 'fabric'
import { Button } from '@/components/ui/neopop/Button'

interface CanvasEditorProps {
  initialContent?: any
  onSave: (content: any) => void
  generatedContent?: any
}

export const CanvasEditor: React.FC<CanvasEditorProps> = ({
  initialContent,
  onSave,
  generatedContent,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null)
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [pages, setPages] = useState<any[]>([])

  useEffect(() => {
    if (!canvasRef.current) return

    const fabricCanvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 1000,
      backgroundColor: '#ffffff',
    })

    setCanvas(fabricCanvas)

    // Initialize with generated content or load existing
    if (generatedContent && !initialContent) {
      initializeFromGeneratedContent(fabricCanvas, generatedContent)
    } else if (initialContent?.pages && initialContent.pages.length > 0) {
      setPages(initialContent.pages)
      loadPage(fabricCanvas, initialContent.pages[0])
    } else {
      // Create a blank page
      const newPage = { id: Date.now().toString(), name: 'Page 1', data: null }
      setPages([newPage])
    }

    // Selection handler
    fabricCanvas.on('selection:created', (e) => {
      setSelectedObject(e.selected?.[0] || null)
    })

    fabricCanvas.on('selection:updated', (e) => {
      setSelectedObject(e.selected?.[0] || null)
    })

    fabricCanvas.on('selection:cleared', () => {
      setSelectedObject(null)
    })

    return () => {
      fabricCanvas.dispose()
    }
  }, [])

  const initializeFromGeneratedContent = (fabricCanvas: fabric.Canvas, content: any) => {
    const newPages: any[] = []
    
    // Create cover page
    fabricCanvas.clear()
    fabricCanvas.backgroundColor = '#ffffff'
    
    const title = new fabric.Textbox(content.title || 'My eBook', {
      left: 100,
      top: 350,
      width: 600,
      fontSize: 56,
      fontWeight: 'bold',
      fill: '#000000',
      textAlign: 'center',
    })
    fabricCanvas.add(title)
    
    if (content.subtitle) {
      const subtitle = new fabric.Textbox(content.subtitle, {
        left: 100,
        top: 480,
        width: 600,
        fontSize: 28,
        fill: '#444444',
        textAlign: 'center',
      })
      fabricCanvas.add(subtitle)
    }
    
    const coverPage = { 
      id: 'cover', 
      name: 'Cover', 
      data: fabricCanvas.toJSON() 
    }
    newPages.push(coverPage)
    
    // Create chapter pages with actual content
    if (content.chapters && Array.isArray(content.chapters)) {
      content.chapters.forEach((chapter: any, index: number) => {
        // Create new canvas for this chapter
        fabricCanvas.clear()
        fabricCanvas.backgroundColor = '#ffffff'
        
        let yPosition = 80
        
        // Chapter title
        const chapterTitle = new fabric.Textbox(`Chapter ${chapter.number}: ${chapter.title}`, {
          left: 80,
          top: yPosition,
          width: 640,
          fontSize: 36,
          fontWeight: 'bold',
          fill: '#000000',
        })
        fabricCanvas.add(chapterTitle)
        yPosition += 100
        
        // Introduction
        if (chapter.introduction) {
          const intro = new fabric.Textbox(chapter.introduction, {
            left: 80,
            top: yPosition,
            width: 640,
            fontSize: 18,
            fill: '#333333',
            lineHeight: 1.5,
          })
          fabricCanvas.add(intro)
          yPosition += 150
        }
        
        // Content paragraphs (first 2 paragraphs to fit on page)
        if (chapter.content && Array.isArray(chapter.content)) {
          const paragraphsToShow = chapter.content.slice(0, 2)
          paragraphsToShow.forEach((paragraph: string) => {
            if (yPosition < 850) {
              const text = new fabric.Textbox(paragraph, {
                left: 80,
                top: yPosition,
                width: 640,
                fontSize: 16,
                fill: '#333333',
                lineHeight: 1.6,
              })
              fabricCanvas.add(text)
              yPosition += 120
            }
          })
        }
        
        const chapterPage = {
          id: `chapter-${index}`,
          name: `Ch ${chapter.number}: ${chapter.title.substring(0, 20)}...`,
          data: fabricCanvas.toJSON(),
        }
        newPages.push(chapterPage)
      })
    }
    
    setPages(newPages)
    
    // Load the first page (cover)
    if (newPages.length > 0) {
      fabricCanvas.clear()
      fabricCanvas.loadFromJSON(newPages[0].data, () => {
        fabricCanvas.renderAll()
      })
    }
    
    setCurrentPage(0)
  }

  const loadPage = (fabricCanvas: fabric.Canvas, page: any) => {
    fabricCanvas.clear()
    fabricCanvas.backgroundColor = '#ffffff'
    
    if (page.data) {
      fabricCanvas.loadFromJSON(page.data, () => {
        fabricCanvas.renderAll()
      })
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
    if (!canvas) return
    savePage() // Save current page before switching
    setCurrentPage(index)
    loadPage(canvas, pages[index])
  }

  const addText = () => {
    if (!canvas) return
    
    const text = new fabric.Textbox('Double click to edit', {
      left: 100,
      top: 100,
      width: 600,
      fontSize: 24,
      fill: '#000000',
    })
    
    canvas.add(text)
    canvas.setActiveObject(text)
    canvas.renderAll()
  }

  const addHeading = () => {
    if (!canvas) return
    
    const heading = new fabric.Textbox('Chapter Title', {
      left: 100,
      top: 100,
      width: 600,
      fontSize: 48,
      fontWeight: 'bold',
      fill: '#000000',
    })
    
    canvas.add(heading)
    canvas.setActiveObject(heading)
    canvas.renderAll()
  }

  const deleteSelected = () => {
    if (!canvas || !selectedObject) return
    canvas.remove(selectedObject)
    canvas.renderAll()
  }

  const changeTextColor = (color: string) => {
    if (!canvas || !selectedObject || selectedObject.type !== 'textbox') return
    selectedObject.set('fill', color)
    canvas.renderAll()
  }

  const changeFontSize = (size: number) => {
    if (!canvas || !selectedObject || selectedObject.type !== 'textbox') return
    (selectedObject as fabric.Textbox).set('fontSize', size)
    canvas.renderAll()
  }

  const changeTextAlign = (align: string) => {
    if (!canvas || !selectedObject || selectedObject.type !== 'textbox') return
    (selectedObject as fabric.Textbox).set('textAlign', align)
    canvas.renderAll()
  }

  const toggleBold = () => {
    if (!canvas || !selectedObject || selectedObject.type !== 'textbox') return
    const textbox = selectedObject as fabric.Textbox
    const isBold = textbox.fontWeight === 'bold'
    textbox.set('fontWeight', isBold ? 'normal' : 'bold')
    canvas.renderAll()
  }

  const toggleItalic = () => {
    if (!canvas || !selectedObject || selectedObject.type !== 'textbox') return
    const textbox = selectedObject as fabric.Textbox
    const isItalic = textbox.fontStyle === 'italic'
    textbox.set('fontStyle', isItalic ? 'normal' : 'italic')
    canvas.renderAll()
  }

  const toggleUnderline = () => {
    if (!canvas || !selectedObject || selectedObject.type !== 'textbox') return
    const textbox = selectedObject as fabric.Textbox
    const hasUnderline = (textbox.underline || false)
    textbox.set('underline', !hasUnderline)
    canvas.renderAll()
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
    canvas.bringToFront(selectedObject)
    canvas.renderAll()
  }

  const sendToBack = () => {
    if (!canvas || !selectedObject) return
    canvas.sendToBack(selectedObject)
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

  const exportToPDF = async () => {
    if (!canvas) return
    
    savePage() // Save current page
    
    // Here we would integrate jsPDF
    alert('PDF export will be implemented. For now, your work is saved!')
  }

  return (
    <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 h-[calc(100vh-200px)] lg:h-[calc(100vh-180px)]">
      {/* Toolbar - Responsive */}
      <div className="w-full lg:w-72 xl:w-80 flex-shrink-0 order-2 lg:order-1 h-auto lg:h-full overflow-hidden">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-3 lg:p-4 h-full overflow-y-auto flex flex-col gap-2">
          <h3 className="font-black text-base lg:text-lg text-gray-900 flex-shrink-0">🎨 Tools</h3>
          
          {/* Add Elements */}
          <div className="grid grid-cols-2 gap-2 flex-shrink-0">
            <button
              onClick={addHeading}
              className="px-2 py-2 lg:px-3 lg:py-2 bg-purple-400 text-gray-900 border-3 border-black font-black hover:bg-purple-500 transition-all text-xs lg:text-sm"
            >
              📝 Heading
            </button>
            
            <button
              onClick={addText}
              className="px-2 py-2 lg:px-3 lg:py-2 bg-blue-400 text-gray-900 border-3 border-black font-black hover:bg-blue-500 transition-all text-xs lg:text-sm"
            >
              📄 Text
            </button>
          </div>
          
          {selectedObject && selectedObject.type === 'textbox' && (
            <div className="pt-2 border-t-3 border-gray-300 space-y-2 flex-shrink-0">
              <h4 className="font-black text-gray-900 text-xs lg:text-sm">✏️ Format</h4>
              
              {/* Font Style Toggles */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={toggleBold}
                  className={`px-2 py-2 border-3 border-black font-black text-sm lg:text-base transition-all ${
                    (selectedObject as fabric.Textbox).fontWeight === 'bold'
                      ? 'bg-amber-400 text-gray-900'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                  }`}
                  title="Bold (Ctrl+B)"
                >
                  <strong>B</strong>
                </button>
                <button
                  onClick={toggleItalic}
                  className={`px-2 py-2 border-3 border-black font-black text-sm lg:text-base transition-all ${
                    (selectedObject as fabric.Textbox).fontStyle === 'italic'
                      ? 'bg-amber-400 text-gray-900'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                  }`}
                  title="Italic (Ctrl+I)"
                >
                  <em>I</em>
                </button>
                <button
                  onClick={toggleUnderline}
                  className={`px-2 py-2 border-3 border-black font-black text-sm lg:text-base transition-all ${
                    (selectedObject as fabric.Textbox).underline
                      ? 'bg-amber-400 text-gray-900'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                  }`}
                  title="Underline (Ctrl+U)"
                >
                  <u>U</u>
                </button>
              </div>
              
              {/* Font Family */}
              <div>
                <label className="text-[10px] lg:text-xs font-black mb-1 block text-gray-900">Font</label>
                <select
                  value={(selectedObject as fabric.Textbox).fontFamily || 'Arial'}
                  onChange={(e) => changeFontFamily(e.target.value)}
                  className="w-full px-2 py-1 border-2 border-black font-bold text-xs bg-white text-gray-900"
                >
                  <option value="Arial">Arial</option>
                  <option value="Times New Roman">Times</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Verdana">Verdana</option>
                  <option value="Impact">Impact</option>
                </select>
              </div>
              
              {/* Font Size */}
              <div>
                <label className="text-[10px] lg:text-xs font-black mb-1 block text-gray-900">Size: {(selectedObject as fabric.Textbox).fontSize || 24}px</label>
                <input
                  type="range"
                  min="8"
                  max="120"
                  value={(selectedObject as fabric.Textbox).fontSize || 24}
                  onChange={(e) => changeFontSize(Number(e.target.value))}
                  className="w-full h-1.5 bg-gray-200 rounded appearance-none cursor-pointer"
                />
              </div>
              
              {/* Text Alignment */}
              <div>
                <label className="text-[10px] lg:text-xs font-black mb-1 block text-gray-900">Align</label>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    onClick={() => changeTextAlign('left')}
                    className="px-1 py-1 bg-gray-200 border-2 border-black font-bold hover:bg-gray-300 text-sm text-gray-900"
                  >
                    ⬅️
                  </button>
                  <button
                    onClick={() => changeTextAlign('center')}
                    className="px-1 py-1 bg-gray-200 border-2 border-black font-bold hover:bg-gray-300 text-sm text-gray-900"
                  >
                    ↔️
                  </button>
                  <button
                    onClick={() => changeTextAlign('right')}
                    className="px-1 py-1 bg-gray-200 border-2 border-black font-bold hover:bg-gray-300 text-sm text-gray-900"
                  >
                    ➡️
                  </button>
                </div>
              </div>
              
              {/* Text Color */}
              <div>
                <label className="text-[10px] lg:text-xs font-black mb-1 block text-gray-900">Color</label>
                <div className="grid grid-cols-8 gap-0.5">
                  {[
                    '#000000', '#FFFFFF', '#FF0000', '#0000FF', '#00FF00', '#FFFF00', '#FFA500', '#800080'
                  ].map(color => (
                    <button
                      key={color}
                      onClick={() => changeTextColor(color)}
                      style={{ backgroundColor: color }}
                      className="w-full aspect-square border border-black hover:scale-105 transition-transform"
                      title={color}
                    />
                  ))}
                </div>
              </div>
              
              {/* Layer Controls */}
              <div>
                <label className="text-[10px] lg:text-xs font-black mb-1 block text-gray-900">Layer</label>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    onClick={bringToFront}
                    className="px-1 py-1 bg-indigo-300 border-2 border-black font-bold hover:bg-indigo-400 text-[10px] text-gray-900"
                  >
                    ⬆️ Front
                  </button>
                  <button
                    onClick={sendToBack}
                    className="px-1 py-1 bg-indigo-300 border-2 border-black font-bold hover:bg-indigo-400 text-[10px] text-gray-900"
                  >
                    ⬇️ Back
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Actions */}
          <div className="pt-2 border-t-3 border-gray-300 space-y-1.5 flex-shrink-0 mt-auto">
            {selectedObject && (
              <button
                onClick={deleteSelected}
                className="w-full px-2 py-1.5 lg:px-3 lg:py-2 bg-rose-400 text-gray-900 border-3 border-black font-black hover:bg-rose-500 transition-all text-xs lg:text-sm"
              >
                🗑️ Delete
              </button>
            )}
            
            <button
              onClick={savePage}
              className="w-full px-2 py-1.5 lg:px-3 lg:py-2 bg-emerald-400 text-gray-900 border-3 border-black font-black hover:bg-emerald-500 transition-all text-xs lg:text-sm"
            >
              💾 Save
            </button>
            
            <button
              onClick={exportToPDF}
              className="w-full px-2 py-1.5 lg:px-3 lg:py-2 bg-amber-400 text-gray-900 border-3 border-black font-black hover:bg-amber-500 transition-all text-xs lg:text-sm"
            >
              📄 Export
            </button>
          </div>
        </div>
      </div>

      {/* Canvas Area - Responsive */}
      <div className="flex-1 order-1 lg:order-2 min-w-0 h-full flex flex-col">
        <div className="bg-gradient-to-br from-gray-100 to-gray-200 p-3 lg:p-6 rounded-xl h-full flex flex-col">
          <div className="bg-white shadow-2xl mx-auto border-4 border-black flex-1 flex items-center justify-center overflow-hidden">
            <div className="relative" style={{ width: '100%', height: '100%', maxWidth: '600px', maxHeight: 'calc(100% - 20px)' }}>
              <canvas ref={canvasRef} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
          </div>
          <div className="text-center mt-2 text-gray-800 font-bold text-xs lg:text-sm flex-shrink-0">
            Page {currentPage + 1}/{pages.length} • Double-click to edit
          </div>
        </div>
      </div>

      {/* Pages Panel - Responsive */}
      <div className="w-full lg:w-56 xl:w-64 flex-shrink-0 order-3 h-auto lg:h-full overflow-hidden">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-3 lg:p-4 h-full flex flex-col">
          <h3 className="font-black text-base lg:text-lg mb-2 text-gray-900 flex-shrink-0">📄 Pages</h3>
          
          <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible lg:overflow-y-auto pb-2 lg:pb-0 mb-2 flex-1 min-h-0">
            {pages.map((page, index) => (
              <button
                key={page.id}
                onClick={() => changePage(index)}
                className={`min-w-[100px] lg:min-w-0 lg:w-full p-2 text-left border-3 border-black font-black transition-all text-xs lg:text-sm flex-shrink-0 ${
                  currentPage === index
                    ? 'bg-amber-400 text-gray-900'
                    : 'bg-white text-gray-900 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="truncate">{page.name}</span>
                  <span className="text-[10px] bg-black text-white px-1.5 py-0.5 rounded flex-shrink-0">{index + 1}</span>
                </div>
              </button>
            ))}
          </div>
          
          <button
            onClick={addNewPage}
            className="w-full px-2 py-1.5 lg:px-3 lg:py-2 bg-fuchsia-400 text-gray-900 border-3 border-black font-black hover:bg-fuchsia-500 transition-all text-xs lg:text-sm flex-shrink-0"
          >
            ➕ Add
          </button>
        </div>
      </div>
    </div>
  )
}

