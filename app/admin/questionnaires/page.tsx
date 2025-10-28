'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/neopop/Card'
import { Button } from '@/components/ui/neopop/Button'
import { Tag } from '@/components/ui/neopop/Tag'
import { Questionnaire } from '@/types'

export default function QuestionnairesPage() {
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

  const deleteQuestionnaire = async (id: string) => {
    if (!confirm('Are you sure you want to delete this questionnaire?')) return

    try {
      await fetch(`/api/questionnaires/${id}`, { method: 'DELETE' })
      setQuestionnaires(questionnaires.filter(q => q.id !== id))
    } catch (error) {
      console.error('Error deleting questionnaire:', error)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-2xl font-bold">Loading questionnaires...</div>
  }

  return (
    <div>
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-5xl font-black mb-2">
            <span className="inline-block bg-purple-300 px-3 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              Questionnaires
            </span>
          </h1>
          <p className="text-gray-600 text-lg">Manage questionnaire templates</p>
        </div>

        <div className="transform hover:scale-105 transition-transform">
          <Button onClick={() => router.push('/admin/questionnaires/create')}>
            + Create Questionnaire
          </Button>
        </div>
      </div>

      {/* Questionnaires Grid */}
      {questionnaires.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-6xl mb-4">📋</div>
          <h2 className="text-2xl font-bold mb-2">No questionnaires yet</h2>
          <p className="text-gray-600 mb-6">Create your first questionnaire template</p>
          <Button onClick={() => router.push('/admin/questionnaires/create')}>
            Create First Questionnaire
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {questionnaires.map((questionnaire) => (
            <Card key={questionnaire.id} hover className="p-6 flex flex-col">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold line-clamp-2">{questionnaire.title}</h3>
                  <Tag color={questionnaire.isPublished ? 'green' : 'yellow'}>
                    {questionnaire.isPublished ? 'Published' : 'Draft'}
                  </Tag>
                </div>

                {questionnaire.description && (
                  <p className="text-gray-600 mb-4 line-clamp-3">{questionnaire.description}</p>
                )}

                <p className="text-sm text-gray-500">
                  {Array.isArray(questionnaire.questions) ? questionnaire.questions.length : 0} questions
                </p>
              </div>

              <div className="space-y-2 mt-4">
                <button
                  onClick={() => router.push(`/admin/questionnaires/${questionnaire.id}/edit`)}
                  className="w-full px-4 py-2 bg-black text-white font-bold border-4 border-black hover:bg-yellow-300 hover:text-black transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteQuestionnaire(questionnaire.id)}
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

