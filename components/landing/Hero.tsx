'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/neopop/Button'

export const Hero: React.FC = () => {
  const router = useRouter()

  return (
    <section className="py-20 md:py-24 flex items-center justify-center bg-gradient-to-br from-violet-300 via-fuchsia-300 to-amber-300 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-amber-400 rounded-full opacity-60 animate-bounce" style={{ animationDuration: '3s' }} />
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-fuchsia-400 rounded-full opacity-60 animate-bounce" style={{ animationDuration: '4s' }} />
      <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-violet-400 rounded-full opacity-60 animate-pulse" />
      
      <div className="container mx-auto px-6 z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block mb-6">
            <div className="px-6 py-2 bg-black text-amber-400 font-bold text-sm uppercase tracking-wider border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-[-2deg]">
              AI-Powered eBook Creation
            </div>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black mb-6 leading-tight">
            <span className="inline-block transform hover:scale-105 transition-transform">Create</span>{' '}
            <span className="inline-block bg-amber-400 px-4 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transform rotate-[-1deg] hover:rotate-[1deg] transition-all">
              Amazing
            </span>{' '}
            <span className="inline-block transform hover:scale-105 transition-transform">eBooks</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-800 font-semibold mb-10 max-w-2xl mx-auto leading-relaxed">
            Answer a few questions, let AI generate your content, edit it like a pro with our Canva-style editor, 
            and export beautiful PDFs ready to share with the world.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <div className="transform hover:scale-105 transition-transform">
              <Button onClick={() => router.push('/signup')}>
                <span className="text-lg font-bold px-6">Get Started Free</span>
              </Button>
            </div>
            <button
              onClick={() => {
                document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="px-8 py-4 text-lg font-bold text-black border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all"
            >
              See How It Works
            </button>
          </div>
          
          <div className="mt-12 flex flex-wrap gap-8 justify-center items-center text-sm font-bold text-gray-800">
            <div className="flex items-center gap-2 bg-white/80 px-4 py-2 rounded-full border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <span className="text-2xl">✨</span>
              <span>AI-Powered</span>
            </div>
            <div className="flex items-center gap-2 bg-white/80 px-4 py-2 rounded-full border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <span className="text-2xl">🎨</span>
              <span>Professional Editor</span>
            </div>
            <div className="flex items-center gap-2 bg-white/80 px-4 py-2 rounded-full border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <span className="text-2xl">📄</span>
              <span>PDF Export</span>
            </div>
            <div className="flex items-center gap-2 bg-white/80 px-4 py-2 rounded-full border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <span className="text-2xl">⚡</span>
              <span>Fast & Easy</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

