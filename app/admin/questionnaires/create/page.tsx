'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/neopop/Card'
import { Button } from '@/components/ui/neopop/Button'
import { Input } from '@/components/ui/neopop/Input'
import { Question } from '@/types'

export default function CreateQuestionnairePage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [currentType, setCurrentType] = useState<Question['type']>('text')
  const [currentOptions, setCurrentOptions] = useState('')
  const [loading, setLoading] = useState(false)

  const addQuestion = () => {
    if (!currentQuestion.trim()) return

    const newQuestion: Question = {
      id: Date.now().toString(),
      type: currentType,
      question: currentQuestion,
      options: currentType === 'multiple-choice' ? currentOptions.split(',').map(o => o.trim()) : undefined,
      required: true,
    }

    setQuestions([...questions, newQuestion])
    setCurrentQuestion('')
    setCurrentOptions('')
  }

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id))
  }

  const handleSubmit = async (isPublished: boolean) => {
    if (!title.trim() || questions.length === 0) {
      alert('Please add a title and at least one question')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/questionnaires', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          questions,
          isPublished,
        }),
      })

      if (response.ok) {
        router.push('/admin/questionnaires')
      } else {
        alert('Failed to create questionnaire')
      }
    } catch (error) {
      console.error('Error creating questionnaire:', error)
      alert('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-5xl font-black mb-2">
          Create{' '}
          <span className="inline-block bg-green-300 px-3 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            Questionnaire
          </span>
        </h1>
        <p className="text-gray-600 text-lg">Create a new questionnaire template</p>
      </div>

      <Card className="p-8 mb-6">
        <Input
          label="Questionnaire Title"
          value={title}
          onChange={setTitle}
          placeholder="e.g., Business eBook Guide"
          required
        />

        <div className="mb-4">
          <label className="block text-sm font-bold mb-2">Description (Optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what this questionnaire is for..."
            className="w-full px-4 py-3 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] outline-none resize-none"
            rows={3}
          />
        </div>
      </Card>

      <Card className="p-8 mb-6">
        <h2 className="text-2xl font-bold mb-6">Add Questions</h2>

        <div className="mb-4">
          <label className="block text-sm font-bold mb-2">Question Type</label>
          <select
            value={currentType}
            onChange={(e) => setCurrentType(e.target.value as Question['type'])}
            className="w-full px-4 py-3 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] outline-none"
          >
            <option value="text">Short Text</option>
            <option value="textarea">Long Text</option>
            <option value="multiple-choice">Multiple Choice</option>
            <option value="rating">Rating (1-5)</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-bold mb-2">Question</label>
          <input
            type="text"
            value={currentQuestion}
            onChange={(e) => setCurrentQuestion(e.target.value)}
            placeholder="Enter your question..."
            className="w-full px-4 py-3 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] outline-none"
          />
        </div>

        {currentType === 'multiple-choice' && (
          <div className="mb-4">
            <label className="block text-sm font-bold mb-2">Options (comma-separated)</label>
            <input
              type="text"
              value={currentOptions}
              onChange={(e) => setCurrentOptions(e.target.value)}
              placeholder="Option 1, Option 2, Option 3"
              className="w-full px-4 py-3 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] outline-none"
            />
          </div>
        )}

        <button
          onClick={addQuestion}
          className="w-full px-6 py-3 bg-purple-300 text-black font-bold border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
        >
          + Add Question
        </button>
      </Card>

      {questions.length > 0 && (
        <Card className="p-8 mb-6">
          <h2 className="text-2xl font-bold mb-6">Questions ({questions.length})</h2>
          <div className="space-y-4">
            {questions.map((q, index) => (
              <div key={q.id} className="p-4 bg-gray-50 border-4 border-gray-300 flex justify-between items-start">
                <div className="flex-1">
                  <span className="font-bold text-purple-600 mr-2">Q{index + 1}:</span>
                  <span className="font-semibold">{q.question}</span>
                  <span className="ml-2 text-xs bg-black text-white px-2 py-1">{q.type}</span>
                  {q.options && (
                    <div className="mt-2 text-sm text-gray-600">
                      Options: {q.options.join(', ')}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => removeQuestion(q.id)}
                  className="ml-4 px-3 py-1 bg-red-500 text-white font-bold hover:bg-red-600"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="flex gap-4">
        <button
          onClick={() => handleSubmit(false)}
          disabled={loading}
          className="flex-1 px-6 py-4 bg-white text-black font-bold border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50"
        >
          Save as Draft
        </button>
        <button
          onClick={() => handleSubmit(true)}
          disabled={loading}
          className="flex-1 px-6 py-4 bg-green-300 text-black font-bold border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50"
        >
          Publish
        </button>
      </div>
    </div>
  )
}

