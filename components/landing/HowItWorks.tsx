'use client'

import React from 'react'
import { Card, Flex, Container, Text, Heading, Box } from '@radix-ui/themes'

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
      <Container size="4">
        <Flex direction="column" align="center" gap="6" className="text-center mb-16">
          <Heading size="9" weight="bold">
            How It{' '}
            <span className="inline-block bg-fuchsia-500 px-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform rotate-[-1deg]">
              Works
            </span>
          </Heading>
          <Text size="5" weight="medium" className="text-gray-700 max-w-2xl">
            Create your professional ebook in just 4 simple steps
          </Text>
        </Flex>
        
        <Flex direction="column" gap="6" className="max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <Flex key={index} gap="6" align="start" direction={{ initial: 'column', md: 'row' }}>
              <Box className={`flex-shrink-0 w-24 h-24 ${step.color} border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl flex items-center justify-center text-4xl font-black transform hover:scale-105 transition-transform`}>
                {step.number}
              </Box>
              
              <Card size="3" variant="surface" className="flex-1 !p-8 !bg-white hover:!shadow-lg transition-shadow">
                <Flex gap="4" align="start">
                  <Text size="9">{step.icon}</Text>
                  <Flex direction="column" gap="3" className="flex-1">
                    <Heading size="6" weight="bold" className="text-gray-900">
                      {step.title}
                    </Heading>
                    <Text size="4" className="text-gray-800 leading-relaxed">
                      {step.description}
                    </Text>
                  </Flex>
                </Flex>
              </Card>
            </Flex>
          ))}
        </Flex>
      </Container>
    </section>
  )
}

