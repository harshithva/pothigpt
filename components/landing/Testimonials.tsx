'use client'

import React, { useEffect, useState } from 'react'
import { Card, Flex, Container, Text, Heading, Avatar, Box } from '@radix-ui/themes'
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
      <Container size="4">
        <Flex direction="column" align="center" gap="6" className="text-center mb-16">
          <Heading size="9" weight="bold">
            What Our{' '}
            <span className="inline-block bg-emerald-500 px-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              Users Say
            </span>
          </Heading>
          <Text size="5" weight="medium" className="text-gray-700 max-w-2xl">
            Join thousands of creators who've already published amazing ebooks
          </Text>
        </Flex>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card key={index} size="3" variant="surface" className="!p-8 !bg-white hover:!shadow-lg transition-shadow">
              <Flex direction="column" gap="4">
                <Flex align="center" gap="4">
                  <Box className="relative w-20 h-20 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-xl overflow-hidden bg-gradient-to-br from-amber-400 to-fuchsia-500">
                    <Image
                      src={testimonial.image}
                      alt={testimonial.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </Box>
                  <Flex direction="column" gap="1">
                    <Text size="4" weight="bold" className="text-gray-900">
                      {testimonial.name}
                    </Text>
                    <Text size="2" weight="medium" className="text-gray-700">
                      {testimonial.role}
                    </Text>
                  </Flex>
                </Flex>
                
                <Flex gap="1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-amber-500 text-2xl">★</span>
                  ))}
                </Flex>
                
                <Text size="3" className="text-gray-800 leading-relaxed italic">
                  "{testimonial.quote}"
                </Text>
              </Flex>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  )
}

