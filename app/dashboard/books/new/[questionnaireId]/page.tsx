'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card } from '@/components/ui/neopop/Card'
import { Button } from '@/components/ui/neopop/Button'
import { Questionnaire, Question } from '@/types'

export default function AnswerQuestionnairePage() {
  const router = useRouter()
  const params = useParams()
  const questionnaireId = params.questionnaireId as string
  
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

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

    try {
      // Generate book content using AI
      const generateResponse = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers,
          questionnaireTitle: questionnaire?.title,
        }),
      })

      const generatedContent = await generateResponse.json()

      // Create initial book structure
      const bookTitle = generatedContent.title || questionnaire?.title || 'My New Book'
      
      // Create book in database
      const createResponse = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: bookTitle,
          questionnaireId,
          answers,
          content: {
            generatedContent,
            pages: [],
            settings: {
              width: 800,
              height: 1000,
              backgroundColor: '#ffffff',
            },
          },
        }),
      })

      const book = await createResponse.json()

      // Redirect to editor
      router.push(`/dashboard/books/${book.id}/edit`)
    } catch (error) {
      console.error('Error creating book:', error)
      alert('Failed to generate book. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-2xl font-bold text-gray-900">Loading questionnaire...</div>
  }

  if (!questionnaire) {
    return (
      <Card className="p-12 text-center max-w-2xl mx-auto bg-white">
        <div className="text-6xl mb-4">❌</div>
        <h2 className="text-2xl font-black mb-2 text-gray-900">Questionnaire not found</h2>
        <p className="text-gray-800 mb-6 font-medium">The questionnaire templates need to be seeded in the database.</p>
        <Button onClick={() => router.push('/dashboard/books/create')}>
          Back to Selection
        </Button>
      </Card>
    )
  }

  const questions = Array.isArray(questionnaire.questions) ? questionnaire.questions : []

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-5xl font-black mb-2 text-gray-900">
          Answer{' '}
          <span className="inline-block bg-emerald-400 px-3 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            Questions
          </span>
        </h1>
        <p className="text-gray-800 text-lg font-semibold">
          Step 2: Answer these questions to help AI generate your ebook
        </p>
      </div>

      <Card className="p-8 mb-6 bg-white">
        <h2 className="text-3xl font-black mb-2 text-gray-900">{questionnaire.title}</h2>
        {questionnaire.description && (
          <p className="text-gray-800 mb-6 font-medium">{questionnaire.description}</p>
        )}
        <p className="text-sm text-gray-800 font-semibold">{questions.length} questions</p>
      </Card>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {questions.map((question: Question, index: number) => (
            <Card key={question.id} className="p-6 bg-white">
              <label className="block mb-4">
                <span className="text-lg font-black mb-2 block text-gray-900">
                  {index + 1}. {question.question}
                  {question.required && <span className="text-rose-600 ml-1">*</span>}
                </span>

                {question.type === 'text' && (
                  <input
                    type="text"
                    value={answers[question.id] || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    required={question.required}
                    className="w-full px-4 py-3 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] outline-none text-gray-900 font-medium placeholder:text-gray-500"
                    placeholder="Your answer..."
                  />
                )}

                {question.type === 'textarea' && (
                  <textarea
                    value={answers[question.id] || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    required={question.required}
                    rows={4}
                    className="w-full px-4 py-3 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] outline-none resize-none text-gray-900 font-medium placeholder:text-gray-500"
                    placeholder="Your detailed answer..."
                  />
                )}

                {question.type === 'multiple-choice' && question.options && (
                  <div className="space-y-2">
                    {question.options.map((option: string, i: number) => (
                      <label key={i} className="flex items-center gap-3 p-3 border-2 border-gray-300 hover:border-black cursor-pointer bg-white">
                        <input
                          type="radio"
                          name={question.id}
                          value={option}
                          checked={answers[question.id] === option}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          required={question.required}
                          className="w-5 h-5"
                        />
                        <span className="text-gray-900 font-medium">{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {question.type === 'rating' && (
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => handleAnswerChange(question.id, rating)}
                        className={`w-12 h-12 font-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all ${
                          answers[question.id] === rating
                            ? 'bg-amber-400 scale-110'
                            : 'bg-white hover:bg-gray-100'
                        }`}
                      >
                        {rating}
                      </button>
                    ))}
                  </div>
                )}
              </label>
            </Card>
          ))}
        </div>

        <div className="mt-8 flex gap-4">
          <button
            type="button"
            onClick={() => router.push('/dashboard/books/create')}
            className="px-6 py-4 bg-white text-black font-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            ← Back
          </button>
          <button
            type="submit"
            disabled={generating}
            className="flex-1 px-6 py-4 bg-emerald-400 text-black font-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50"
          >
            {generating ? 'Generating Your Book...' : 'Generate Book with AI →'}
          </button>
        </div>
      </form>
    </div>
  )
}

