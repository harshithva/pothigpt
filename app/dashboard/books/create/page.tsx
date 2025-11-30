'use client'

import React, { useMemo, useState } from 'react'
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
  TextArea,
  Switch,
  Separator,
} from '@radix-ui/themes'
import {
  ArrowLeftIcon,
  CheckCircledIcon,
  LightningBoltIcon,
  ReloadIcon,
  RocketIcon,
  PlusIcon,
  TrashIcon,
} from '@radix-ui/react-icons'
import type { ChapterStructure, SimplifiedBookInput } from '@/types'

interface EditableChapter extends ChapterStructure {
  summary: string
  approved: boolean
}

interface OptionalSection {
  title: string
  summary: string
  enabled: boolean
}

type CreationStep = 1 | 2 | 3

const CHAPTER_COUNT_OPTIONS = [10, 11, 12, 13, 14, 15]

export default function CreateBookPage() {
  const router = useRouter()

  const [step, setStep] = useState<CreationStep>(1)
  const [bookType, setBookType] = useState<SimplifiedBookInput['bookType']>()
  const [audience, setAudience] = useState<SimplifiedBookInput['audience']>()
  const [bookTitle, setBookTitle] = useState('')
  const [chapterCount, setChapterCount] = useState<number>(10)

  const [outlineGenerating, setOutlineGenerating] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [chapters, setChapters] = useState<EditableChapter[]>([])
  const [prologue, setPrologue] = useState<OptionalSection | null>(null)
  const [epilogue, setEpilogue] = useState<OptionalSection | null>(null)
  const [categoryLabel, setCategoryLabel] = useState<string>('')

  const canContinueStep1 = Boolean(bookType && audience)
  const canContinueStep2 = Boolean(bookTitle.trim())

  const selectionSummary = useMemo(() => {
    if (!bookType || !audience) return ''
    const formattedType = bookType === 'fiction' ? 'Fiction' : 'Non-fiction'
    const formattedAudience = audience === 'kids' ? 'Kids' : 'Adult'
    return `${formattedAudience} ${formattedType}`
  }, [bookType, audience])

  const resetOutlineState = () => {
    setChapters([])
    setPrologue(null)
    setEpilogue(null)
    setCategoryLabel('')
  }

  const mapResponseToState = (response: any) => {
    const resolvedChapters: EditableChapter[] = Array.isArray(response?.chapters)
      ? response.chapters.map((chapter: any, index: number) => {
        const sanitizedSubheadings = Array.isArray(chapter.subheadings)
          ? chapter.subheadings.filter((s: string) => typeof s === 'string' && s.trim())
          : []

        return {
          number: typeof chapter.number === 'number' ? chapter.number : index + 1,
          heading: chapter.heading || chapter.title || `Chapter ${index + 1}`,
          summary: chapter.summary || chapter.description || '',
          subheadings: sanitizedSubheadings.length > 0 ? sanitizedSubheadings : [''],
          approved: false,
        }
      })
      : []

    if (resolvedChapters.length === 0) {
      throw new Error('No chapters returned from outline generator')
    }

    const resolvedPrologue: OptionalSection | null = response?.prologue?.title
      ? {
          title: response.prologue.title,
          summary: response.prologue.summary || response.prologue.description || '',
          enabled: true,
        }
      : null

    const resolvedEpilogue: OptionalSection | null = response?.epilogue?.title
      ? {
          title: response.epilogue.title,
          summary: response.epilogue.summary || response.epilogue.description || '',
          enabled: true,
        }
      : null

    setChapters(resolvedChapters)
    setPrologue(resolvedPrologue)
    setEpilogue(resolvedEpilogue)
    setCategoryLabel(response?.category || selectionSummary)
  }

  const handleGenerateOutline = async () => {
    if (!bookType || !audience) {
      setError('Please choose fiction vs non-fiction and the audience first.')
      setStep(1)
      return
    }

    if (!bookTitle.trim()) {
      setError('Book title is required before generating chapters.')
      setStep(2)
      return
    }

    setOutlineGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookType,
          audience,
          bookTitle: bookTitle.trim(),
          chapterCount,
        }),
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}))
        throw new Error(errorBody.error || 'Failed to generate outline')
      }

      const data = await response.json()
      mapResponseToState(data)
      setStep(3)
    } catch (err) {
      console.error('[CreateBook] Outline generation failed:', err)
      const message = err instanceof Error ? err.message : 'Outline generation failed.'
      setError(message)
    } finally {
      setOutlineGenerating(false)
    }
  }

  const updateChapter = (index: number, updater: (chapter: EditableChapter) => EditableChapter) => {
    setChapters(prev => prev.map((chapter, idx) => (idx === index ? updater(chapter) : chapter)))
  }

  const handleAddSubheading = (index: number) => {
    updateChapter(index, chapter => {
      const nextSubheadings = [...chapter.subheadings, '']
      return {
        ...chapter,
        approved: false,
        subheadings: nextSubheadings.slice(0, 6),
      }
    })
  }

  const handleRemoveSubheading = (chapterIndex: number, subIndex: number) => {
    updateChapter(chapterIndex, chapter => {
      const nextSubheadings = chapter.subheadings.filter((_, idx) => idx !== subIndex)
      return {
        ...chapter,
        approved: false,
        subheadings: nextSubheadings.length > 0 ? nextSubheadings : [''],
      }
    })
  }

  const buildContentPayload = () => {
    const normalizedChapters = chapters.map((chapter, index) => ({
      number: chapter.number ?? index + 1,
      title: chapter.heading.trim() || `Chapter ${index + 1}`,
      description: chapter.summary.trim(),
      subheadings: chapter.subheadings.map(sub => sub.trim()).filter(Boolean),
    }))

    const outlinePayload = {
      title: bookTitle.trim(),
      category: categoryLabel || selectionSummary,
      audience,
      bookType,
      prologue: prologue && prologue.enabled
        ? {
            title: prologue.title.trim() || 'Prologue',
            description: prologue.summary.trim(),
          }
        : undefined,
      chapters: normalizedChapters,
      epilogue: epilogue && epilogue.enabled
        ? {
            title: epilogue.title.trim() || 'Epilogue',
            description: epilogue.summary.trim(),
          }
        : undefined,
    }

    const chapterStatus = normalizedChapters.reduce<Record<number, string>>((acc, chapter) => {
      acc[chapter.number] = 'pending'
      return acc
    }, {})

    return {
      outline: outlinePayload,
      chapterStatus,
      generatedChapters: {},
      conversationHistory: [],
      answers: {
        bookType,
        audience,
        bookTitle: bookTitle.trim(),
        chapterCount,
        outline: outlinePayload,
      },
      pages: [],
      settings: {
        width: 800,
        height: 1000,
        backgroundColor: '#ffffff',
      },
    }
  }

  const handleCreateBook = async () => {
    if (chapters.length === 0) {
      setError('Generate and approve chapters before creating the book.')
      return
    }

    const hasEmptyHeading = chapters.some(chapter => !chapter.heading.trim())
    const hasEmptySubheading = chapters.some(chapter => chapter.subheadings.every(sub => !sub.trim()))
    const hasUnapproved = chapters.some(chapter => !chapter.approved)

    if (hasEmptyHeading) {
      setError('Each chapter needs a heading before continuing.')
      return
    }

    if (hasEmptySubheading) {
      setError('Each chapter must include at least one subheading.')
      return
    }

    if (hasUnapproved) {
      setError('Approve every chapter before creating the book.')
      return
    }

    setCreateLoading(true)
    setError(null)

    try {
      const contentPayload = buildContentPayload()
      const response = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: bookTitle.trim(),
          questionnaireId: null,
          answers: {
            flow: 'simplified-builder',
            input: {
              bookType,
              audience,
              bookTitle: bookTitle.trim(),
              chapterCount,
            },
            chapters: chapters.map(({ number, heading, summary, subheadings }) => ({
              number,
              heading,
              summary,
              subheadings,
            })),
            prologue,
            epilogue,
          },
          content: contentPayload,
        }),
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}))
        throw new Error(errorBody.error || 'Failed to create book')
      }

      const book = await response.json()
      router.push(`/dashboard/books/${book.id}/edit`)
    } catch (err) {
      console.error('[CreateBook] Failed to create book:', err)
      const message = err instanceof Error ? err.message : 'Failed to create book.'
      setError(message)
    } finally {
      setCreateLoading(false)
    }
  }

  const renderStepBadge = (currentStep: CreationStep) => (
    <Badge size="2" color="blue" variant="soft" radius="full" className="w-fit">
      <Flex align="center" gap="2">
        <PlusIcon width="14" height="14" /> Step {currentStep} of 3
      </Flex>
    </Badge>
  )

  const renderHeader = (title: string, description: string, currentStep: CreationStep) => (
    <Flex direction="column" gap="3">
      {renderStepBadge(currentStep)}
      <Heading size="8" weight="bold" style={{ color: '#1e293b' }}>
        {title}
      </Heading>
      <Text size="5" style={{ color: '#64748b', lineHeight: '1.6' }}>
        {description}
      </Text>
    </Flex>
  )

  const renderErrorBanner = () => (
    error ? (
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
    ) : null
  )

  const renderStep1 = () => (
    <>
      {renderHeader(
        'Choose Your Book Type',
        'Start by selecting whether you want to create a fiction or non-fiction book, then choose who it is for.',
        1,
      )}

      <Flex gap="4" wrap="wrap">
        {[{ value: 'fiction', label: 'Fiction', helper: 'Stories, novels, adventures' }, { value: 'non-fiction', label: 'Non-fiction', helper: 'Guides, manuals, real-world insights' }].map(option => {
          const isActive = bookType === option.value
          return (
            <Card
              key={option.value}
              size="4"
              onClick={() => {
                if (bookType !== option.value) {
                  resetOutlineState()
                  setAudience(undefined)
                }
                setBookType(option.value as SimplifiedBookInput['bookType'])
              }}
              className="hover-lift transition-all cursor-pointer"
              style={{
                flex: '1 1 280px',
                border: isActive ? '2px solid #2563eb' : '1px solid #e2e8f0',
                background: isActive ? 'linear-gradient(135deg, #e0f2fe, #eef2ff)' : 'white',
              }}
            >
              <Flex direction="column" gap="3">
                <Flex align="center" gap="3">
                  <LightningBoltIcon width="24" height="24" color={isActive ? '#1d4ed8' : '#64748b'} />
                  <Heading size="5" weight="bold" style={{ color: '#1e293b' }}>
                    {option.label}
                  </Heading>
                </Flex>
                <Text size="3" style={{ color: '#475569' }}>{option.helper}</Text>
                {isActive && (
                  <Badge color="blue" variant="solid" size="2" className="w-fit">
                    Selected
                  </Badge>
                )}
              </Flex>
            </Card>
          )
        })}
      </Flex>

      {bookType && (
        <Box>
          <Separator size="4" className="my-6" />
          <Heading size="5" weight="bold" style={{ color: '#1e293b' }}>
            Who is this book for?
          </Heading>
          <Flex gap="4" mt="4" wrap="wrap">
            {[{ value: 'adult', label: 'Adult Readers', helper: 'Professional, mature, elevated tone' }, { value: 'kids', label: 'Kids & Young Readers', helper: 'Playful, guiding, age-appropriate' }].map(option => {
              const isActive = audience === option.value
    return (
                <Card
                  key={option.value}
                  size="3"
                  onClick={() => {
                    resetOutlineState()
                    setAudience(option.value as SimplifiedBookInput['audience'])
                  }}
                  className="hover-lift transition-all cursor-pointer"
                  style={{
                    flex: '1 1 260px',
                    border: isActive ? '2px solid #22c55e' : '1px solid #e2e8f0',
                    background: isActive ? 'linear-gradient(135deg, #dcfce7, #f0fdf4)' : 'white',
                  }}
                >
                  <Flex direction="column" gap="2">
                    <Heading size="4" weight="bold" style={{ color: '#14532d' }}>
                      {option.label}
                    </Heading>
                    <Text size="3" style={{ color: '#166534' }}>{option.helper}</Text>
                    {isActive && (
                      <Badge color="green" variant="solid" size="2" className="w-fit">
                        Selected
                      </Badge>
                    )}
                  </Flex>
                </Card>
              )
            })}
          </Flex>
        </Box>
      )}

      <Flex justify="between" align="center" mt="8">
        <Button
          size="3"
          variant="ghost"
          color="gray"
          onClick={() => router.push('/dashboard/books')}
          className="!cursor-pointer"
        >
          <Flex align="center" gap="2">
            <ArrowLeftIcon width="16" height="16" />
            <Text>Back to Books</Text>
          </Flex>
        </Button>
        <Button
          size="3"
          variant="solid"
          color="blue"
          disabled={!canContinueStep1}
          onClick={() => setStep(2)}
          className="!cursor-pointer"
        >
          Continue
        </Button>
      </Flex>
    </>
  )

  const renderStep2 = () => (
    <>
      {renderHeader(
        'Enter Book Details',
        'Give your book a title and choose how many chapters you want the AI to plan. You can tweak everything later.',
        2,
      )}

      <Flex direction="column" gap="5" mt="4">
        <Box>
          <Text size="3" weight="bold" style={{ color: '#1e293b' }}>
            Book Title
          </Text>
          <TextField.Root
            size="3"
            value={bookTitle}
            onChange={(event) => {
              resetOutlineState()
              setBookTitle(event.target.value)
            }}
            placeholder="e.g., The Secrets of Oceanlight"
            className="mt-2"
          />
        </Box>

        <Box>
          <Text size="3" weight="bold" style={{ color: '#1e293b' }}>
            Chapters Required
          </Text>
          <select
            value={chapterCount}
            onChange={(event) => {
              resetOutlineState()
              setChapterCount(Number(event.target.value))
            }}
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {CHAPTER_COUNT_OPTIONS.map(option => (
              <option key={option} value={option}>
                {option} Chapters
              </option>
            ))}
          </select>
          <Text size="2" style={{ color: '#64748b' }} className="mt-2 block">
            Choose between 10 and 15 chapters. Each chapter will include detailed subheadings you can edit.
          </Text>
        </Box>
      </Flex>

      {renderErrorBanner()}

      <Flex justify="between" align="center" mt="8">
        <Button
          size="3"
          variant="ghost"
          color="gray"
          onClick={() => setStep(1)}
          className="!cursor-pointer"
        >
          <Flex align="center" gap="2">
            <ArrowLeftIcon width="16" height="16" />
            <Text>Back</Text>
          </Flex>
        </Button>

        <Button
          size="3"
          variant="solid"
          color="blue"
          disabled={!canContinueStep2 || outlineGenerating}
          onClick={handleGenerateOutline}
          className="!cursor-pointer"
        >
          {outlineGenerating ? (
            <Flex align="center" gap="2">
              <ReloadIcon className="animate-spin" width="16" height="16" />
              <Text>Generating…</Text>
            </Flex>
          ) : (
            <Flex align="center" gap="2">
              <RocketIcon width="16" height="16" />
              <Text>Generate Chapter Structure</Text>
            </Flex>
          )}
        </Button>
      </Flex>
    </>
  )

  const renderChapterGrid = () => (
    <Box
      style={{
        border: '1px solid #cbd5f5',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      <Box
        style={{
          display: 'grid',
          gridTemplateColumns: '80px 1.4fr 1.6fr 140px',
          background: 'linear-gradient(135deg, #e0f2fe, #e9d5ff)',
          padding: '12px 16px',
          fontWeight: 600,
          color: '#1e293b',
        }}
      >
        <Text size="2">Chapter</Text>
        <Text size="2">Heading</Text>
        <Text size="2">Subheadings</Text>
        <Text size="2">Status</Text>
      </Box>

      {chapters.map((chapter, chapterIndex) => (
        <Box
          key={chapter.number}
          style={{
            display: 'grid',
            gridTemplateColumns: '80px 1.4fr 1.6fr 140px',
            padding: '16px',
            borderTop: '1px solid #e2e8f0',
            background: chapterIndex % 2 === 0 ? '#f8fafc' : '#ffffff',
          }}
        >
          <Flex direction="column" gap="2">
            <Badge size="2" color="blue" variant="soft">
              #{chapter.number}
            </Badge>
            <Text size="1" style={{ color: '#64748b' }}>Subheadings: {chapter.subheadings.length}</Text>
          </Flex>

          <Flex direction="column" gap="2">
            <TextField.Root
              size="2"
              value={chapter.heading}
              onChange={(event) => updateChapter(chapterIndex, current => ({
                ...current,
                heading: event.target.value,
                approved: false,
              }))}
            />
            <TextArea
              size="2"
              value={chapter.summary}
              onChange={(event) => updateChapter(chapterIndex, current => ({
                ...current,
                summary: event.target.value,
                approved: false,
              }))}
              rows={3}
              placeholder="Short summary of this chapter"
            />
          </Flex>

          <Flex direction="column" gap="2">
            {chapter.subheadings.map((subheading, subIndex) => (
              <Flex key={subIndex} align="center" gap="2">
                <TextField.Root
                  size="2"
                  value={subheading}
                  onChange={(event) => updateChapter(chapterIndex, current => {
                    const next = [...current.subheadings]
                    next[subIndex] = event.target.value
                    return {
                      ...current,
                      subheadings: next,
                      approved: false,
                    }
                  })}
                  placeholder={`Subheading ${subIndex + 1}`}
                  className="flex-1"
                />
                {chapter.subheadings.length > 1 && (
                  <Button
                    size="1"
                    color="red"
                    variant="soft"
                    onClick={() => handleRemoveSubheading(chapterIndex, subIndex)}
                  >
                    <TrashIcon width="12" height="12" />
                  </Button>
                )}
              </Flex>
            ))}
            {chapter.subheadings.length < 6 && (
              <Button
                size="1"
                variant="soft"
                color="gray"
                onClick={() => handleAddSubheading(chapterIndex)}
                className="w-fit"
              >
                <Flex align="center" gap="1">
                  <PlusIcon width="12" height="12" />
                  <Text size="1">Add subheading</Text>
                </Flex>
              </Button>
            )}
          </Flex>

          <Flex direction="column" gap="2" align="start">
            <Flex align="center" gap="2">
              <Switch
                size="2"
                checked={chapter.approved}
                onCheckedChange={(checked) => updateChapter(chapterIndex, current => ({
                  ...current,
                  approved: checked,
                }))}
              />
              <Text size="3" weight="bold" style={{ color: chapter.approved ? '#15803d' : '#dc2626' }}>
                {chapter.approved ? 'Approved' : 'Needs Review'}
              </Text>
            </Flex>
            <Text size="2" style={{ color: '#64748b' }}>
              Toggle when you are happy with this structure.
            </Text>
          </Flex>
        </Box>
      ))}
    </Box>
  )

  const renderOptionalSectionEditor = (label: string, section: OptionalSection | null, setSection: (value: OptionalSection | null) => void) => {
    if (!section) return null

    return (
      <Card size="3" style={{ border: '1px solid #dbeafe', background: '#f8fafc' }}>
        <Flex direction="column" gap="3">
          <Flex justify="between" align="center">
            <Heading size="4" weight="bold" style={{ color: '#1e293b' }}>
              {label}
            </Heading>
            <Flex align="center" gap="2">
              <Switch
                size="2"
                checked={section.enabled}
                onCheckedChange={(checked) => setSection({ ...section, enabled: checked })}
              />
              <Text size="2" style={{ color: section.enabled ? '#15803d' : '#dc2626' }}>
                {section.enabled ? 'Included' : 'Excluded'}
              </Text>
            </Flex>
          </Flex>

          <TextField.Root
            size="3"
            value={section.title}
            onChange={(event) => setSection({ ...section, title: event.target.value })}
            placeholder={`${label} Title`}
          />
          <TextArea
            size="3"
            value={section.summary}
            onChange={(event) => setSection({ ...section, summary: event.target.value })}
            rows={3}
            placeholder={`${label} summary (2-3 sentences)`}
          />
        </Flex>
      </Card>
    )
  }

  const renderStep3 = () => (
    <>
      {renderHeader(
        'Review & Approve Chapter Plan',
        'We generated a chapter-by-chapter plan with detailed subheadings. Tweak anything, approve each chapter, and then create the book.',
        3,
      )}

      {selectionSummary && (
        <Badge size="3" variant="soft" color="blue" className="w-fit">
          {selectionSummary}
        </Badge>
      )}

      <Box className="mt-6 space-y-4">
        {renderErrorBanner()}

        <Card size="3" style={{ border: '1px solid #e2e8f0', background: '#ffffff' }}>
          <Flex direction="column" gap="4">
            <Flex justify="between" align="center">
              <Heading size="5" weight="bold" style={{ color: '#1e293b' }}>
                Generated Chapter Blueprint
              </Heading>
              <Button
                size="2"
                variant="soft"
                color="blue"
                onClick={handleGenerateOutline}
                disabled={outlineGenerating}
              >
                <Flex align="center" gap="2">
                  <ReloadIcon className={outlineGenerating ? 'animate-spin' : ''} width="14" height="14" />
                  <Text>{outlineGenerating ? 'Regenerating…' : 'Regenerate'}</Text>
                </Flex>
              </Button>
            </Flex>

            {renderChapterGrid()}
          </Flex>
        </Card>

        <Flex direction="column" gap="4">
          {renderOptionalSectionEditor('Prologue', prologue, setPrologue)}
          {renderOptionalSectionEditor('Epilogue', epilogue, setEpilogue)}
        </Flex>
      </Box>

      <Flex justify="between" align="center" mt="8">
        <Button
          size="3"
          variant="ghost"
          color="gray"
          onClick={() => setStep(2)}
          className="!cursor-pointer"
        >
          <Flex align="center" gap="2">
            <ArrowLeftIcon width="16" height="16" />
            <Text>Back</Text>
          </Flex>
        </Button>

        <Button
          size="3"
          variant="solid"
          color="green"
          onClick={handleCreateBook}
          disabled={createLoading}
          className="!cursor-pointer"
        >
          {createLoading ? (
            <Flex align="center" gap="2">
              <CheckCircledIcon className="animate-pulse" width="16" height="16" />
              <Text>Creating…</Text>
            </Flex>
          ) : (
            <Flex align="center" gap="2">
              <RocketIcon width="16" height="16" />
              <Text>Approve & Create Book</Text>
            </Flex>
          )}
        </Button>
      </Flex>
    </>
  )

  return (
    <Box className="max-w-6xl mx-auto">
      <Flex direction="column" gap="5" className="mb-12">
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
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
              </Flex>
            </Card>
    </Box>
  )
}
