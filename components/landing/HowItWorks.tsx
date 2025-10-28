'use client'

import React from 'react'
import { Card } from '@/components/ui/neopop/Card'

const steps = [
  {
    number: '01',
    title: 'Answer Questions',
    description: 'Select a questionnaire template and answer questions about your ebook topic. Our AI needs this to understand what you want to create.',
    color: 'bg-violet-500',
    icon: '📝',
  },
  {
    number: '02',
    title: 'AI Generates Content',
    description: 'Our advanced AI processes your answers and generates a complete ebook structure with chapters, content, and flow.',
    color: 'bg-fuchsia-500',
    icon: '🤖',
  },
  {
    number: '03',
    title: 'Edit & Design',
    description: 'Use our Canva-style editor to customize every aspect. Add images, change fonts, adjust layouts, and make it perfect.',
    color: 'bg-amber-500',
    icon: '🎨',
  },
  {
    number: '04',
    title: 'Export & Share',
    description: 'When you\'re happy with your ebook, export it as a professional PDF ready to share, sell, or distribute.',
    color: 'bg-emerald-500',
    icon: '🚀',
  },
]

export const HowItWorks: React.FC = () => {
  return (
    <section id="how-it-works" className="py-24 bg-gradient-to-br from-cyan-300 to-violet-300">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-black mb-4">
            How It{' '}
            <span className="inline-block bg-fuchsia-500 px-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform rotate-[-1deg]">
              Works
            </span>
          </h2>
          <p className="text-xl text-gray-700 font-semibold max-w-2xl mx-auto">
            Create your professional ebook in just 4 simple steps
          </p>
        </div>
        
        <div className="max-w-5xl mx-auto">
          <div className="space-y-8">
            {steps.map((step, index) => (
              <div key={index} className="flex flex-col md:flex-row gap-6 items-start">
                <div className={`flex-shrink-0 w-24 h-24 ${step.color} border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl flex items-center justify-center text-4xl font-black transform hover:scale-105 transition-transform`}>
                  {step.number}
                </div>
                
                <Card hover className="flex-1 p-8 bg-white">
                  <div className="flex items-start gap-4">
                    <div className="text-5xl">{step.icon}</div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-black mb-3 text-gray-900">{step.title}</h3>
                      <p className="text-gray-800 leading-relaxed text-lg font-medium">{step.description}</p>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

