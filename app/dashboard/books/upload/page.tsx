'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  Button,
  Flex,
  Heading,
  Text,
  Box,
  Badge,
  TextField,
} from '@radix-ui/themes'
import {
  ArrowLeftIcon,
  UploadIcon,
  ReaderIcon,
  CheckCircledIcon,
  ReloadIcon,
} from '@radix-ui/react-icons'

export default function UploadPDFPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ bookId: string; title: string } | null>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setError('Please select a PDF file')
        return
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB')
        return
      }
      setFile(selectedFile)
      setError(null)
      // Auto-fill title from filename if not set
      if (!title) {
        setTitle(selectedFile.name.replace(/\.pdf$/i, ''))
      }
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a PDF file')
      return
    }

    setUploading(true)
    setError(null)
    setSuccess(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      if (title.trim()) {
        formData.append('title', title.trim())
      }

      const response = await fetch('/api/books/upload-pdf', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to upload PDF')
      }

      const data = await response.json()
      setSuccess({
        bookId: data.book.id,
        title: data.book.title,
      })

      // Redirect to book edit page after a short delay
      setTimeout(() => {
        router.push(`/dashboard/books/${data.book.id}/edit`)
      }, 2000)
    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'Failed to upload PDF')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Box className="max-w-3xl mx-auto">
      <Flex direction="column" gap="5" className="mb-8">
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
      </Flex>

      <Card size="5" style={{ background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 20px 45px rgba(15, 23, 42, 0.08)' }}>
        <Flex direction="column" gap="6">
          <Flex direction="column" gap="3">
            <Badge size="2" color="blue" variant="soft" radius="full" className="w-fit">
              <Flex align="center" gap="2">
                <UploadIcon width="14" height="14" /> Upload PDF
              </Flex>
            </Badge>
            <Heading size="8" weight="bold" style={{ color: '#1e293b' }}>
              Upload PDF for Audiobook
            </Heading>
            <Text size="5" style={{ color: '#64748b', lineHeight: '1.6' }}>
              Upload a PDF file and convert it to an audiobook using AI. The system will extract text from your PDF and generate a high-quality audio narration.
            </Text>
          </Flex>

          {error && (
            <Card
              size="3"
              style={{
                background: 'rgba(248, 113, 113, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#991b1b',
              }}
            >
              <Flex align="center" gap="3">
                <Text weight="bold">{error}</Text>
                <Button size="2" variant="ghost" color="red" onClick={() => setError(null)}>
                  Dismiss
                </Button>
              </Flex>
            </Card>
          )}

          {success && (
            <Card
              size="3"
              style={{
                background: 'rgba(34, 197, 94, 0.12)',
                border: '1px solid rgba(34, 197, 94, 0.4)',
                color: '#166534',
              }}
            >
              <Flex align="center" gap="3">
                <CheckCircledIcon width="20" height="20" />
                <Flex direction="column" gap="1">
                  <Text weight="bold">PDF uploaded successfully!</Text>
                  <Text size="2">Redirecting to book editor...</Text>
                </Flex>
              </Flex>
            </Card>
          )}

          <Flex direction="column" gap="4">
            <Box>
              <Text size="3" weight="bold" style={{ color: '#1e293b', marginBottom: '0.5rem', display: 'block' }}>
                PDF File
              </Text>
              <Box
                style={{
                  border: '2px dashed #cbd5e1',
                  borderRadius: '8px',
                  padding: '2rem',
                  textAlign: 'center',
                  background: file ? '#f0f9ff' : '#f8fafc',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onClick={() => document.getElementById('pdf-input')?.click()}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.currentTarget.style.borderColor = '#3b82f6'
                }}
                onDragLeave={(e) => {
                  e.currentTarget.style.borderColor = '#cbd5e1'
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  e.currentTarget.style.borderColor = '#cbd5e1'
                  const droppedFile = e.dataTransfer.files[0]
                  if (droppedFile && droppedFile.type === 'application/pdf') {
                    setFile(droppedFile)
                    if (!title) {
                      setTitle(droppedFile.name.replace(/\.pdf$/i, ''))
                    }
                  } else {
                    setError('Please drop a PDF file')
                  }
                }}
              >
                <input
                  id="pdf-input"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                {file ? (
                  <Flex direction="column" align="center" gap="3">
                    <ReaderIcon width="48" height="48" color="#3b82f6" />
                    <Flex direction="column" align="center" gap="1">
                      <Text weight="bold" style={{ color: '#1e293b' }}>
                        {file.name}
                      </Text>
                      <Text size="2" style={{ color: '#64748b' }}>
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </Text>
                    </Flex>
                    <Button
                      size="2"
                      variant="soft"
                      color="gray"
                      onClick={(e) => {
                        e.stopPropagation()
                        setFile(null)
                        setTitle('')
                      }}
                    >
                      Change File
                    </Button>
                  </Flex>
                ) : (
                  <Flex direction="column" align="center" gap="3">
                    <UploadIcon width="48" height="48" color="#94a3b8" />
                    <Flex direction="column" align="center" gap="1">
                      <Text weight="bold" style={{ color: '#1e293b' }}>
                        Click to upload or drag and drop
                      </Text>
                      <Text size="2" style={{ color: '#64748b' }}>
                        PDF file (max 10MB)
                      </Text>
                    </Flex>
                  </Flex>
                )}
              </Box>
            </Box>

            <Box>
              <Text size="3" weight="bold" style={{ color: '#1e293b', marginBottom: '0.5rem', display: 'block' }}>
                Book Title (Optional)
              </Text>
              <TextField.Root
                size="3"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter book title (defaults to filename if not provided)"
              />
              <Text size="2" style={{ color: '#64748b' }} className="mt-2 block">
                If not provided, the filename will be used as the book title.
              </Text>
            </Box>
          </Flex>

          <Flex justify="between" align="center" mt="4">
            <Button
              size="3"
              variant="ghost"
              color="gray"
              onClick={() => router.push('/dashboard/books')}
              className="!cursor-pointer"
              disabled={uploading}
            >
              <Flex align="center" gap="2">
                <ArrowLeftIcon width="16" height="16" />
                <Text>Cancel</Text>
              </Flex>
            </Button>
            <Button
              size="3"
              variant="solid"
              color="blue"
              onClick={handleUpload}
              disabled={!file || uploading || !!success}
              className="!cursor-pointer"
            >
              {uploading ? (
                <Flex align="center" gap="2">
                  <ReloadIcon className="animate-spin" width="16" height="16" />
                  <Text>Uploading...</Text>
                </Flex>
              ) : (
                <Flex align="center" gap="2">
                  <UploadIcon width="16" height="16" />
                  <Text>Upload & Create Book</Text>
                </Flex>
              )}
            </Button>
          </Flex>

          <Box
            style={{
              padding: '1rem',
              background: '#f0f9ff',
              borderRadius: '8px',
              border: '1px solid #bae6fd',
            }}
          >
            <Text size="2" style={{ color: '#0369a1' }}>
              <strong>Note:</strong> After uploading, you can generate the audiobook from the book editor page. 
              The system will extract text from your PDF and convert it to high-quality audio narration.
            </Text>
          </Box>
        </Flex>
      </Card>
    </Box>
  )
}

