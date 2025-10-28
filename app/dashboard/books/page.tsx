'use client'

import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/neopop/Card'
import { Button } from '@/components/ui/neopop/Button'
import { Tag } from '@/components/ui/neopop/Tag'
import { Book } from '@/types'

export default function BooksPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchBooks()
  }, [])

  const fetchBooks = async () => {
    try {
      const response = await fetch('/api/books')
      const data = await response.json()
      setBooks(data)
    } catch (error) {
      console.error('Error fetching books:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteBook = async (id: string) => {
    if (!confirm('Are you sure you want to delete this book?')) return

    try {
      await fetch(`/api/books/${id}`, { method: 'DELETE' })
      setBooks(books.filter(book => book.id !== id))
    } catch (error) {
      console.error('Error deleting book:', error)
    }
  }

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return <div className="text-center py-12 text-2xl font-bold text-gray-900">Loading your books...</div>
  }

  return (
    <div>
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-5xl font-black mb-2 text-gray-900">
            My{' '}
            <span className="inline-block bg-fuchsia-400 px-3 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              Books
            </span>
          </h1>
          <p className="text-gray-800 text-lg font-semibold">Manage and edit your ebooks</p>
        </div>

        <div className="transform hover:scale-105 transition-transform">
          <Button onClick={() => router.push('/dashboard/books/create')}>
            + Create New Book
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-8">
        <input
          type="text"
          placeholder="Search books..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full md:w-96 px-4 py-3 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] outline-none transition-all text-lg text-gray-900 font-medium placeholder:text-gray-500"
        />
      </div>

      {/* Books Grid */}
      {filteredBooks.length === 0 ? (
        <Card className="p-12 text-center bg-white">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-2xl font-black mb-2 text-gray-900">No books yet</h2>
          <p className="text-gray-800 mb-6 font-medium">Create your first ebook to get started</p>
          <Button onClick={() => router.push('/dashboard/books/create')}>
            Create Your First Book
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBooks.map((book) => (
            <Card key={book.id} hover className="p-6 flex flex-col bg-white">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-black line-clamp-2 text-gray-900">{book.title}</h3>
                  <Tag color={book.status === 'PUBLISHED' ? 'green' : 'yellow'}>
                    {book.status}
                  </Tag>
                </div>

                <p className="text-gray-800 text-sm mb-4 font-semibold">
                  Created {new Date(book.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => router.push(`/dashboard/books/${book.id}/edit`)}
                  className="w-full px-4 py-2 bg-black text-white font-bold border-4 border-black hover:bg-yellow-300 hover:text-black transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteBook(book.id)}
                  className="w-full px-4 py-2 bg-white text-red-600 font-bold border-4 border-red-600 hover:bg-red-600 hover:text-white transition-colors"
                >
                  Delete
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

