'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/neopop/Card'
import { Button } from '@/components/ui/neopop/Button'
import { Questionnaire } from '@/types'

export default function CreateBookPage() {
  const router = useRouter()
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchQuestionnaires()
  }, [])

  const fetchQuestionnaires = async () => {
    try {
      const response = await fetch('/api/questionnaires')
      const data = await response.json()
      setQuestionnaires(data)
    } catch (error) {
      console.error('Error fetching questionnaires:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-2xl font-bold text-gray-900">Loading questionnaires...</div>
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-5xl font-black mb-2 text-gray-900">
          Create{' '}
          <span className="inline-block bg-amber-400 px-3 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            New Book
          </span>
        </h1>
        <p className="text-gray-800 text-lg font-semibold">Step 1: Select a questionnaire template to get started</p>
      </div>

      {questionnaires.length === 0 ? (
        <Card className="p-12 text-center bg-white">
          <div className="text-6xl mb-4">📋</div>
          <h2 className="text-2xl font-black mb-2 text-gray-900">No questionnaires available</h2>
          <p className="text-gray-800 mb-6 font-medium">Create a questionnaire first to start making ebooks</p>
          <Button onClick={() => router.push('/admin/questionnaires/create')}>
            Create Questionnaire
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {questionnaires.map((questionnaire) => (
            <Card key={questionnaire.id} hover className="p-6 flex flex-col bg-white">
              <div className="flex-1">
                <h3 className="text-2xl font-black mb-3 text-gray-900">{questionnaire.title}</h3>
                
                {questionnaire.description && (
                  <p className="text-gray-800 mb-4 font-medium">{questionnaire.description}</p>
                )}
                
                <p className="text-sm text-gray-800 mb-4 font-semibold">
                  {Array.isArray(questionnaire.questions) ? questionnaire.questions.length : 0} questions to answer
                </p>
              </div>

              <Button 
                onClick={() => router.push(`/dashboard/books/new/${questionnaire.id}`)}
                fullWidth
              >
                Use This Template
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

