'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { CanvasEditor } from '@/components/editor/CanvasEditor'
import { Book } from '@/types'

export default function EditBookPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session } = useSession()
  const bookId = params.id as string
  
  const [book, setBook] = useState<Book | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchBook()
  }, [bookId])

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
        throw new Error('Failed to save')
      }
    } catch (error) {
      console.error('Error saving book:', error)
      alert('Failed to save book')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl font-bold">Loading editor...</div>
      </div>
    )
  }

  if (!book) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl font-bold">Book not found</div>
      </div>
    )
  }

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="mb-4 lg:mb-6 flex items-center justify-between bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-4 lg:p-6">
        <div className="flex-1">
          <button
            onClick={() => router.push('/dashboard/books')}
            className="text-gray-900 hover:text-gray-700 font-black mb-3 inline-flex items-center gap-2 hover:underline"
          >
            ← Back to Books
          </button>
          <h1 className="text-4xl font-black text-gray-900">
            <span className="inline-block bg-amber-400 px-4 py-1 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -rotate-1">
              {book.title}
            </span>
          </h1>
        </div>
        
        {saving && (
          <div className="px-6 py-3 bg-emerald-400 border-4 border-black font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-pulse">
            💾 Saving...
          </div>
        )}
      </div>

      {/* Editor */}
      <CanvasEditor
        initialContent={book.content}
        onSave={handleSave}
        generatedContent={(book.content as any)?.generatedContent}
      />
    </div>
  )
}

