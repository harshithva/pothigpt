'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, Button, Flex, Heading, Text, TextField, TextArea, Box, RadioGroup, Grid, Badge, Separator } from '@radix-ui/themes'
import { ArrowLeftIcon, FileTextIcon, QuestionMarkCircledIcon, RocketIcon, StarFilledIcon, Cross2Icon, CheckCircledIcon } from '@radix-ui/react-icons'
import { Questionnaire, Question } from '@/types'

export default function AnswerQuestionnairePage() {
  const router = useRouter()
  const params = useParams()
  const questionnaireId = params.questionnaireId as string
  
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchQuestionnaire = async () => {
    try {
      const response = await fetch(`/api/questionnaires/${questionnaireId}`)
      const data = await response.json()
      setQuestionnaire(data)
    } catch (error) {
      console.error('Error fetching questionnaire:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQuestionnaire()
  }, [questionnaireId])

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers({
      ...answers,
      [questionId]: value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGenerating(true)
    setError(null)

    try {
      console.log('[Book Generation] Starting generation process...')
      console.log('[Book Generation] Answers:', answers)
      console.log('[Book Generation] Questionnaire:', questionnaire?.title)
      
      // Generate book content using AI
      const generateResponse = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers,
          questionnaireTitle: questionnaire?.title,
        }),
      })

      if (!generateResponse.ok) {
        const errorData = await generateResponse.json().catch(() => ({}))
        console.error('[Book Generation] Generate API error:', generateResponse.status, errorData)
        throw new Error(`Failed to generate content: ${errorData.error || generateResponse.statusText}`)
      }

      const outline = await generateResponse.json()
      console.log('[Book Generation] Generated outline:', outline)
      console.log('[Book Generation] Has chapters?', !!outline?.chapters)
      console.log('[Book Generation] Chapter count:', outline?.chapters?.length)
      console.log('[Book Generation] Outline keys:', Object.keys(outline || {}))
      
      if (!outline || !outline.chapters || outline.chapters.length === 0) {
        console.error('[Book Generation] Invalid outline structure')
        console.error('[Book Generation] Received:', JSON.stringify(outline))
        throw new Error('Generated outline is empty or invalid')
      }

      // Create initial book structure with outline and chapter generation tracking
      const bookTitle = outline.title || questionnaire?.title || 'My New Book'
      console.log('[Book Generation] Creating book with title:', bookTitle)
      
      // Initialize chapter status - all chapters start as 'pending'
      const chapterStatus: Record<number, string> = {}
      outline.chapters.forEach((ch: any) => {
        chapterStatus[ch.number] = 'pending'
      })
      
      // Create book in database with outline structure
      const createResponse = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: bookTitle,
          questionnaireId,
          answers,
          content: {
            outline, // Chapter structure with titles and descriptions
            chapterStatus, // Track which chapters are generated
            generatedChapters: {}, // Will store generated chapter content
            conversationHistory: [], // Maintains context across chapters
            answers, // Store for chapter generation
            pages: [],
            settings: {
              width: 800,
              height: 1000,
              backgroundColor: '#ffffff',
            },
          },
        }),
      })

      if (!createResponse.ok) {
        const errorData = await createResponse.json().catch(() => ({}))
        console.error('[Book Generation] Create API error:', createResponse.status, errorData)
        throw new Error(`Failed to create book: ${errorData.error || createResponse.statusText}`)
      }

      const book = await createResponse.json()
      console.log('[Book Generation] Book created:', book.id)

      // Redirect to editor
      console.log('[Book Generation] Redirecting to editor...')
      router.push(`/dashboard/books/${book.id}/edit`)
    } catch (error) {
      console.error('[Book Generation] Error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setError(`Failed to generate book: ${errorMessage}`)
      alert(`Failed to generate book: ${errorMessage}`)
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <Flex align="center" justify="center" className="py-12">
        <Text size="6" weight="bold" style={{ color: '#1e293b' }}>Loading questionnaire...</Text>
      </Flex>
    )
  }

  if (!questionnaire) {
    return (
      <Card 
        size="4" 
        className="!p-12 text-center max-w-2xl mx-auto"
        style={{ 
          background: 'white',
          border: '1px solid #e0e7ff',
          boxShadow: '0 10px 30px rgba(37, 99, 235, 0.1)'
        }}
      >
        <Flex direction="column" align="center" gap="6">
          <Flex
            align="center"
            justify="center"
            className="w-20 h-20 rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, #fee2e2, #fecaca)',
              border: '1px solid #fca5a5'
            }}
          >
            <Cross2Icon width="40" height="40" color="#dc2626" />
          </Flex>
          <Heading size="6" weight="bold" style={{ color: '#1e293b' }}>
            Questionnaire not found
          </Heading>
          <Text size="4" style={{ color: '#64748b' }}>
            The questionnaire templates need to be seeded in the database.
          </Text>
          <Button 
            size="4"
            variant="solid" 
            color="blue" 
            highContrast
            onClick={() => router.push('/dashboard/books/create')}
            className="!cursor-pointer shadow-glow-blue"
          >
            <Flex align="center" gap="2">
              <ArrowLeftIcon width="16" height="16" />
              <Text>Back to Selection</Text>
            </Flex>
          </Button>
        </Flex>
      </Card>
    )
  }

  const questions: Question[] = Array.isArray(questionnaire.questions) 
    ? (questionnaire.questions as unknown as Question[])
    : []

  return (
    <Box className="max-w-4xl mx-auto">
      {/* Header */}
      <Flex direction="column" gap="5" className="mb-12">
        <Button
          size="2"
          variant="ghost"
          onClick={() => router.push('/dashboard/books/create')}
          className="!cursor-pointer !font-medium !justify-start !w-fit"
          style={{ color: '#64748b' }}
        >
          <Flex align="center" gap="2">
            <ArrowLeftIcon width="14" height="14" />
            <Text>Back to Templates</Text>
          </Flex>
        </Button>
        
        <Flex direction="column" gap="3">
          <Badge size="2" color="blue" variant="soft" radius="full" className="w-fit">
            <QuestionMarkCircledIcon width="14" height="14" /> Step 2 of 3
          </Badge>
          <Heading size="8" weight="bold" style={{ color: '#1e293b' }}>
            Answer Questions
          </Heading>
          <Text size="5" style={{ color: '#64748b', lineHeight: '1.6' }}>
            Help AI generate your ebook by answering these questions. The more detailed your answers, the better your ebook will be.
          </Text>
        </Flex>
      </Flex>

      {/* Questionnaire Info Card */}
      <Card 
        size="4" 
        className="mb-8 relative overflow-hidden"
        style={{ 
          background: 'white',
          border: '1px solid #e0e7ff',
          boxShadow: '0 10px 30px rgba(37, 99, 235, 0.1)'
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
            background: 'linear-gradient(90deg, #3b82f6, #2563eb)'
          }}
        />
        
        <Flex direction="column" gap="4" style={{ paddingTop: '0.5rem' }}>
          <Flex align="start" gap="4">
            <Flex
              align="center"
              justify="center"
              className="w-14 h-14 rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                border: '1px solid #bfdbfe',
                flexShrink: 0
              }}
            >
              <FileTextIcon width="28" height="28" color="#2563eb" />
            </Flex>
            <Flex direction="column" gap="2" className="flex-1">
              <Heading size="6" weight="bold" style={{ color: '#1e293b' }}>
                {questionnaire.title}
              </Heading>
              {questionnaire.description && (
                <Text size="3" style={{ color: '#64748b', lineHeight: '1.6' }}>
                  {questionnaire.description}
                </Text>
              )}
            </Flex>
          </Flex>
          
          <Separator size="4" />
          
          <Flex align="center" gap="6">
            <Flex align="center" gap="2">
              <QuestionMarkCircledIcon width="18" height="18" color="#3b82f6" />
              <Text size="2" weight="bold" style={{ color: '#1e293b' }}>
                {questions.length} questions to answer
              </Text>
            </Flex>
            <Flex align="center" gap="2">
              <CheckCircledIcon width="18" height="18" color="#10b981" />
              <Text size="2" weight="bold" style={{ color: '#1e293b' }}>
                AI-powered generation
              </Text>
            </Flex>
          </Flex>
        </Flex>
      </Card>

      {/* Questions Form */}
      <form onSubmit={handleSubmit}>
        <Flex direction="column" gap="6">
          {questions.map((question, index) => (
            <Card 
              key={question.id} 
              size="4"
              className="hover-lift"
              style={{ 
                background: 'white',
                border: '1px solid #e0e7ff',
                boxShadow: '0 5px 15px rgba(37, 99, 235, 0.05)'
              }}
            >
              <Flex direction="column" gap="4">
                <Flex align="start" gap="4">
                  <Flex
                    align="center"
                    justify="center"
                    className="w-12 h-12 rounded-xl"
                    style={{ 
                      background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                      boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
                      flexShrink: 0
                    }}
                  >
                    <Text size="5" weight="bold" style={{ color: 'white' }}>
                      {index + 1}
                    </Text>
                  </Flex>
                  <Flex direction="column" gap="2" className="flex-1">
                    <Text size="4" weight="bold" style={{ color: '#1e293b', lineHeight: '1.5' }}>
                      {question.question}
                      {question.required && <Text as="span" style={{ color: '#ef4444' }}> *</Text>}
                    </Text>
                  </Flex>
                </Flex>

                {question.type === 'text' && (
                  <TextField.Root
                    size="3"
                    value={answers[question.id] || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    required={question.required}
                    placeholder="Type your answer..."
                    variant="surface"
                    color="blue"
                  />
                )}

                {question.type === 'textarea' && (
                  <TextArea
                    size="3"
                    value={answers[question.id] || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    required={question.required}
                    rows={5}
                    placeholder="Type your detailed answer..."
                    color="blue"
                  />
                )}

                {question.type === 'multiple-choice' && question.options && (
                  <RadioGroup.Root
                    value={answers[question.id] || ''}
                    onValueChange={(value) => handleAnswerChange(question.id, value)}
                    required={question.required}
                  >
                    <Flex direction="column" gap="3">
                      {question.options.map((option: string, i: number) => (
                        <label 
                          key={i} 
                          className="flex items-center gap-3 p-4 rounded-lg cursor-pointer transition-all hover-lift"
                          style={{ 
                            border: answers[question.id] === option ? '2px solid #3b82f6' : '1px solid #e0e7ff',
                            background: answers[question.id] === option ? '#eff6ff' : 'white'
                          }}
                        >
                          <RadioGroup.Item value={option} />
                          <Text size="3" weight="medium" style={{ color: '#1e293b' }}>
                            {option}
                          </Text>
                        </label>
                      ))}
                    </Flex>
                  </RadioGroup.Root>
                )}

                {question.type === 'rating' && (
                  <Flex gap="2" wrap="wrap">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <Button
                        key={rating}
                        type="button"
                        size="4"
                        variant={answers[question.id] === rating ? 'solid' : 'soft'}
                        color={answers[question.id] === rating ? 'blue' : 'gray'}
                        onClick={() => handleAnswerChange(question.id, rating)}
                        className="!cursor-pointer !font-bold"
                        style={{
                          minWidth: '56px',
                          minHeight: '56px',
                          transition: 'all 0.2s ease',
                          transform: answers[question.id] === rating ? 'scale(1.05)' : 'scale(1)'
                        }}
                      >
                        <Flex align="center" gap="1">
                          <StarFilledIcon width="18" height="18" />
                          <Text>{rating}</Text>
                        </Flex>
                      </Button>
                    ))}
                  </Flex>
                )}
              </Flex>
            </Card>
          ))}
        </Flex>

        {/* Submit Section */}
        <Card 
          size="4" 
          className="mt-8 relative overflow-hidden"
          style={{ 
            background: 'white',
            border: '1px solid #e0e7ff',
            boxShadow: '0 10px 30px rgba(37, 99, 235, 0.15)'
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
              background: 'linear-gradient(90deg, #10b981, #059669)'
            }}
          />
          
          <Flex direction="column" gap="5" style={{ paddingTop: '0.5rem' }}>
            <Flex align="start" gap="4">
              <Flex
                align="center"
                justify="center"
                className="w-16 h-16 rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
                  border: '1px solid #6ee7b7',
                  flexShrink: 0
                }}
              >
                <RocketIcon width="32" height="32" color="#059669" />
              </Flex>
              <Flex direction="column" gap="2" className="flex-1">
                <Heading size="6" weight="bold" style={{ color: '#1e293b' }}>
                  Ready to generate your ebook?
                </Heading>
                <Text size="3" style={{ color: '#64748b', lineHeight: '1.6' }}>
                  Our AI will analyze your answers and create a professional ebook for you. This usually takes 30-60 seconds.
                </Text>
              </Flex>
            </Flex>
            
            <Separator size="4" />
            
            {error && (
              <Card style={{ background: '#fee2e2', border: '1px solid #fca5a5' }}>
                <Flex align="center" gap="3">
                  <Cross2Icon width="20" height="20" color="#dc2626" />
                  <Text size="3" style={{ color: '#991b1b' }}>{error}</Text>
                </Flex>
              </Card>
            )}
            
            <Flex gap="3" direction={{ initial: 'column', sm: 'row' }}>
              <Button
                size="4"
                variant="soft"
                color="gray"
                type="button"
                onClick={() => router.push('/dashboard/books/create')}
                className="!cursor-pointer !font-medium"
              >
                <Flex align="center" gap="2">
                  <ArrowLeftIcon width="16" height="16" />
                  <Text>Cancel</Text>
                </Flex>
              </Button>
              <Button
                size="4"
                variant="solid"
                color="blue"
                type="submit"
                disabled={generating}
                highContrast
                className="flex-1 !cursor-pointer !font-bold shadow-glow-blue"
              >
                {generating ? (
                  <Flex align="center" gap="2">
                    <RocketIcon width="18" height="18" className="animate-pulse" />
                    <Text>Generating Your Book...</Text>
                  </Flex>
                ) : (
                  <Flex align="center" gap="2">
                    <RocketIcon width="18" height="18" />
                    <Text>Generate Book with AI</Text>
                  </Flex>
                )}
              </Button>
            </Flex>
          </Flex>
        </Card>
      </form>
    </Box>
  )
}
