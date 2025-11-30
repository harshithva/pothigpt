'use client'

import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, Button, Badge, Flex, Heading, Text, TextField, Box, Grid } from '@radix-ui/themes'
import { PlusIcon, MagnifyingGlassIcon, Pencil1Icon, TrashIcon, ReaderIcon } from '@radix-ui/react-icons'
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
      setBooks(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching books:', error)
      setBooks([])
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

  const filteredBooks = Array.isArray(books) ? books.filter(book =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase())
  ) : []

  if (loading) {
    return (
      <Flex align="center" justify="center" className="py-12">
        <Text size="6" weight="bold" style={{ color: '#1e293b' }}>Loading your books...</Text>
      </Flex>
    )
  }

  return (
    <Flex direction="column" gap="8">
      {/* Header */}
      <Flex direction={{ initial: 'column', md: 'row' }} justify="between" align={{ initial: 'start', md: 'center' }} gap="6">
        <Box>
          <Heading size="8" weight="bold" style={{ color: '#1e293b', marginBottom: '0.5rem' }}>
            My Books
          </Heading>
          <Text size="4" style={{ color: '#64748b' }}>
            Manage and edit your ebooks
          </Text>
        </Box>

        <Button 
          size="4"
          variant="solid" 
          color="blue" 
          highContrast
          onClick={() => router.push('/dashboard/books/create')}
          className="!cursor-pointer shadow-glow-blue"
        >
          <Flex align="center" gap="2">
            <PlusIcon width="18" height="18" />
            <Text>Create New Book</Text>
          </Flex>
        </Button>
      </Flex>

      {/* Search */}
      <Box className="w-full md:w-96">
        <TextField.Root
          size="3"
          placeholder="Search books..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          variant="surface"
          color="blue"
        >
          <TextField.Slot side="left">
            <MagnifyingGlassIcon width="16" height="16" />
          </TextField.Slot>
        </TextField.Root>
      </Box>

      {/* Books Grid */}
      {filteredBooks.length === 0 ? (
        <Card 
          size="4" 
          className="!p-16 text-center"
          style={{ 
            background: 'white',
            border: '1px solid #e0e7ff',
            boxShadow: '0 10px 30px rgba(37, 99, 235, 0.1)'
          }}
        >
          <Flex direction="column" align="center" gap="6">
            <ReaderIcon width="64" height="64" color="#94a3b8" />
            <Heading size="6" weight="bold" style={{ color: '#1e293b' }}>
              {searchQuery ? 'No books found' : 'No books yet'}
            </Heading>
            <Text size="4" style={{ color: '#64748b' }}>
              {searchQuery ? 'Try a different search term' : 'Create your first ebook to get started'}
            </Text>
            {!searchQuery && (
              <Button 
                size="4"
                variant="solid" 
                color="blue" 
                highContrast
                onClick={() => router.push('/dashboard/books/create')}
                className="!cursor-pointer shadow-glow-blue"
              >
                <Flex align="center" gap="2">
                  <PlusIcon width="18" height="18" />
                  <Text>Create Your First Book</Text>
                </Flex>
              </Button>
            )}
          </Flex>
        </Card>
      ) : (
        <Grid columns={{ initial: "1", md: "2", lg: "3" }} gap="6">
          {filteredBooks.map((book) => (
            <Card 
              key={book.id} 
              size="4"
              className="hover-lift transition-all"
              style={{
                background: 'white',
                border: '1px solid #e0e7ff',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Decorative gradient bar */}
              <Box 
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: book.status === 'PUBLISHED' 
                    ? 'linear-gradient(90deg, #10b981, #059669)'
                    : 'linear-gradient(90deg, #3b82f6, #2563eb)'
                }}
              />
              
              <Flex direction="column" gap="4" height="100%" style={{ paddingTop: '0.5rem' }}>
                {/* Header */}
                <Flex justify="between" align="start" gap="3">
                  <Flex 
                    align="center" 
                    justify="center"
                    className="w-12 h-12 rounded-xl"
                    style={{ 
                      background: book.status === 'PUBLISHED' 
                        ? 'linear-gradient(135deg, #d1fae5, #a7f3d0)'
                        : 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                      border: book.status === 'PUBLISHED'
                        ? '1px solid #6ee7b7'
                        : '1px solid #bfdbfe'
                    }}
                  >
                    <ReaderIcon 
                      width="24" 
                      height="24" 
                      color={book.status === 'PUBLISHED' ? '#059669' : '#2563eb'} 
                    />
                  </Flex>
                  <Badge 
                    color={book.status === 'PUBLISHED' ? 'green' : 'blue'}
                    variant="soft"
                    size="2"
                    highContrast
                  >
                    {book.status}
                  </Badge>
                </Flex>

                {/* Content */}
                <Flex direction="column" gap="2" className="flex-1">
                  <Heading size="5" weight="bold" style={{ color: '#1e293b', lineHeight: '1.3' }}>
                    {book.title}
                  </Heading>

                  <Flex align="center" gap="2">
                    <Text size="2" style={{ color: '#94a3b8' }}>
                      Created {new Date(book.createdAt).toLocaleDateString()}
                    </Text>
                  </Flex>
                </Flex>

                {/* Actions */}
                <Flex direction="column" gap="2">
                  <Button
                    size="3"
                    variant="solid"
                    color="blue"
                    highContrast
                    onClick={() => router.push(`/dashboard/books/${book.id}/edit`)}
                    className="w-full !cursor-pointer"
                  >
                    <Flex align="center" justify="center" gap="2" style={{ width: '100%' }}>
                      <Pencil1Icon width="16" height="16" />
                      <Text>Edit Book</Text>
                    </Flex>
                  </Button>
                  <Button
                    size="3"
                    variant="soft"
                    color="red"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteBook(book.id)
                    }}
                    className="w-full !cursor-pointer"
                  >
                    <Flex align="center" justify="center" gap="2" style={{ width: '100%' }}>
                      <TrashIcon width="16" height="16" />
                      <Text>Delete</Text>
                    </Flex>
                  </Button>
                </Flex>
              </Flex>
            </Card>
          ))}
        </Grid>
      )}
    </Flex>
  )
}
