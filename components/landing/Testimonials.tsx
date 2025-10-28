'use client'

import React, { useEffect, useState } from 'react'
import { Card } from '@/components/ui/neopop/Card'
import Image from 'next/image'

interface Testimonial {
  name: string
  role: string
  image: string
  quote: string
  rating: number
}

const defaultTestimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Content Creator',
    image: 'https://randomuser.me/api/portraits/women/44.jpg',
    quote: 'This tool cut my ebook creation time from weeks to hours. The AI content is surprisingly good, and the editor is intuitive.',
    rating: 5,
  },
  {
    name: 'Michael Chen',
    role: 'Online Coach',
    image: 'https://randomuser.me/api/portraits/men/32.jpg',
    quote: 'I\'ve created 5 ebooks so far for my courses. The questionnaire system ensures I never miss important topics.',
    rating: 5,
  },
  {
    name: 'Emma Williams',
    role: 'Marketing Consultant',
    image: 'https://randomuser.me/api/portraits/women/68.jpg',
    quote: 'The export quality is excellent. My clients love the professional-looking PDFs I deliver to them.',
    rating: 5,
  },
]

export const Testimonials: React.FC = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(defaultTestimonials)

  useEffect(() => {
    // Fetch random users from the API
    fetch('https://randomuser.me/api/?results=3&nat=us,gb,au&seed=ebook')
      .then(response => response.json())
      .then(data => {
        const fetchedTestimonials = [
          {
            name: 'Sarah Johnson',
            role: 'Content Creator',
            image: data.results[0]?.picture?.large || defaultTestimonials[0].image,
            quote: 'This tool cut my ebook creation time from weeks to hours. The AI content is surprisingly good, and the editor is intuitive.',
            rating: 5,
          },
          {
            name: 'Michael Chen',
            role: 'Online Coach',
            image: data.results[1]?.picture?.large || defaultTestimonials[1].image,
            quote: 'I\'ve created 5 ebooks so far for my courses. The questionnaire system ensures I never miss important topics.',
            rating: 5,
          },
          {
            name: 'Emma Williams',
            role: 'Marketing Consultant',
            image: data.results[2]?.picture?.large || defaultTestimonials[2].image,
            quote: 'The export quality is excellent. My clients love the professional-looking PDFs I deliver to them.',
            rating: 5,
          },
        ]
        setTestimonials(fetchedTestimonials)
      })
      .catch(() => {
        // If API fails, keep using default images
        console.log('Using default testimonial images')
      })
  }, [])

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-black mb-4">
            What Our{' '}
            <span className="inline-block bg-emerald-500 px-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              Users Say
            </span>
          </h2>
          <p className="text-xl text-gray-700 font-semibold max-w-2xl mx-auto">
            Join thousands of creators who've already published amazing ebooks
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card key={index} hover className="p-8 bg-white">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative w-20 h-20 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-xl overflow-hidden bg-gradient-to-br from-amber-400 to-fuchsia-500">
                  <Image
                    src={testimonial.image}
                    alt={testimonial.name}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
                <div>
                  <div className="font-black text-lg text-gray-900">{testimonial.name}</div>
                  <div className="text-gray-700 text-sm font-semibold">{testimonial.role}</div>
                </div>
              </div>
              
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <span key={i} className="text-amber-500 text-2xl">★</span>
                ))}
              </div>
              
              <p className="text-gray-800 leading-relaxed font-medium italic">
                "{testimonial.quote}"
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

