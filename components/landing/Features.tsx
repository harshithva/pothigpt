'use client'

import React from 'react'
import { Card, Flex, Container, Text, Heading, Box } from '@radix-ui/themes'

const features = [
  {
    emoji: '🤖',
    title: 'AI Content Generation',
    description: 'Answer a simple questionnaire and let our AI generate professional, engaging content tailored to your needs.',
    color: 'bg-violet-500',
    borderColor: 'border-violet-900',
    titleColor: 'text-violet-700',
  },
  {
    emoji: '✏️',
    title: 'Canva-Style Editor',
    description: 'Edit your ebook with a powerful visual editor. Add text, images, customize layouts, and make it truly yours.',
    color: 'bg-fuchsia-500',
    borderColor: 'border-fuchsia-900',
    titleColor: 'text-fuchsia-700',
  },
  {
    emoji: '📚',
    title: 'Multiple Templates',
    description: 'Choose from beautifully designed templates for covers, chapters, and layouts to make your ebook stand out.',
    color: 'bg-amber-500',
    borderColor: 'border-amber-900',
    titleColor: 'text-amber-800',
  },
  {
    emoji: '🎯',
    title: 'Questionnaire System',
    description: 'Structured questionnaires ensure your ebook covers all important topics and maintains professional quality.',
    color: 'bg-cyan-500',
    borderColor: 'border-cyan-900',
    titleColor: 'text-cyan-700',
  },
  {
    emoji: '💾',
    title: 'Auto-Save',
    description: 'Never lose your work. Every change is automatically saved so you can continue from where you left off.',
    color: 'bg-emerald-500',
    borderColor: 'border-emerald-900',
    titleColor: 'text-emerald-700',
  },
  {
    emoji: '📤',
    title: 'PDF Export',
    description: 'Export your finished ebook as a high-quality PDF ready for distribution, printing, or sharing.',
    color: 'bg-rose-500',
    borderColor: 'border-rose-900',
    titleColor: 'text-rose-700',
  },
]

export const Features: React.FC = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
      <Container size="4">
        <Flex direction="column" align="center" gap="6" className="text-center mb-16">
          <Heading size="9" weight="bold" className="text-gray-900">
            Everything You Need to Create{' '}
            <span className="inline-block bg-amber-400 px-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              Amazing eBooks
            </span>
          </Heading>
          <Text size="5" weight="medium" className="text-gray-700 max-w-2xl">
            From ideation to publication, we've got you covered with powerful features
          </Text>
        </Flex>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} size="3" variant="surface" className="!p-8 !bg-white hover:!shadow-lg transition-shadow">
              <Flex direction="column" gap="4">
                <Box className={`w-20 h-20 ${feature.color} border-4 ${feature.borderColor} flex items-center justify-center text-4xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-lg`}>
                  {feature.emoji}
                </Box>
                <Heading size="6" weight="bold" className={feature.titleColor}>
                  {feature.title}
                </Heading>
                <Text size="3" className="text-gray-800 leading-relaxed">
                  {feature.description}
                </Text>
              </Flex>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  )
}

