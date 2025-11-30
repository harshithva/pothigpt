'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Button, Flex, Container, Text, Badge } from '@radix-ui/themes'

export const Hero: React.FC = () => {
  const router = useRouter()

  return (
    <section className="py-20 md:py-24 flex items-center justify-center bg-gradient-to-br from-violet-300 via-fuchsia-300 to-amber-300 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-amber-400 rounded-full opacity-60 animate-bounce" style={{ animationDuration: '3s' }} />
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-fuchsia-400 rounded-full opacity-60 animate-bounce" style={{ animationDuration: '4s' }} />
      <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-violet-400 rounded-full opacity-60 animate-pulse" />
      
      <Container size="4" className="z-10">
        <Flex direction="column" align="center" gap="6" className="max-w-4xl mx-auto text-center">
          <Badge size="2" variant="solid" color="amber" highContrast className="!px-6 !py-2 !text-sm !uppercase !tracking-wider">
            AI-Powered eBook Creation
          </Badge>
          
          <h1 className="text-6xl md:text-8xl font-black leading-tight">
            <span className="inline-block transform hover:scale-105 transition-transform">Create</span>{' '}
            <span className="inline-block bg-amber-400 px-4 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transform rotate-[-1deg] hover:rotate-[1deg] transition-all">
              Amazing
            </span>{' '}
            <span className="inline-block transform hover:scale-105 transition-transform">eBooks</span>
          </h1>
          
          <Text size="5" weight="medium" className="text-gray-800 max-w-2xl">
            Answer a few questions, let AI generate your content, edit it like a pro with our Canva-style editor, 
            and export beautiful PDFs ready to share with the world.
          </Text>
          
          <Flex gap="4" wrap="wrap" justify="center" className="mt-4">
            <Button 
              size="4" 
              variant="solid" 
              color="amber" 
              highContrast
              onClick={() => router.push('/signup')}
              className="!px-8 !font-black !cursor-pointer"
            >
              Get Started Free
            </Button>
            <Button
              size="4"
              variant="outline"
              color="gray"
              highContrast
              onClick={() => {
                document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="!font-black !cursor-pointer !bg-white"
            >
              See How It Works
            </Button>
          </Flex>
          
          <Flex gap="4" wrap="wrap" justify="center" className="mt-8">
            <Badge size="3" variant="surface" color="gray" radius="full" className="!px-4 !py-2 !bg-white/80 !border-2 !border-black !shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <span className="text-2xl mr-2">✨</span>
              <Text weight="bold">AI-Powered</Text>
            </Badge>
            <Badge size="3" variant="surface" color="gray" radius="full" className="!px-4 !py-2 !bg-white/80 !border-2 !border-black !shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <span className="text-2xl mr-2">🎨</span>
              <Text weight="bold">Professional Editor</Text>
            </Badge>
            <Badge size="3" variant="surface" color="gray" radius="full" className="!px-4 !py-2 !bg-white/80 !border-2 !border-black !shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <span className="text-2xl mr-2">📄</span>
              <Text weight="bold">PDF Export</Text>
            </Badge>
            <Badge size="3" variant="surface" color="gray" radius="full" className="!px-4 !py-2 !bg-white/80 !border-2 !border-black !shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <span className="text-2xl mr-2">⚡</span>
              <Text weight="bold">Fast & Easy</Text>
            </Badge>
          </Flex>
        </Flex>
      </Container>
    </section>
  )
}

