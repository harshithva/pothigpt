'use client'

import { Container, Flex, Heading, Button, Box, Text } from '@radix-ui/themes'
import { ReaderIcon, RocketIcon } from '@radix-ui/react-icons'
import Link from 'next/link'

export function Header() {
  return (
    <Box 
      className="sticky top-0 z-50 backdrop-blur-xl bg-white/90 border-b"
      style={{
        borderColor: '#e0e7ff',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
      }}
    >
      <Container size="4">
        <Flex justify="between" align="center" py="3" px={{ initial: '4', md: '0' }}>
          {/* Logo */}
          <Link href="/" className="no-underline">
            <Flex align="center" gap="3" className="hover:opacity-80 transition-all">
              <Flex
                align="center"
                justify="center"
                className="w-10 h-10 rounded-xl"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)'
                }}
              >
                <ReaderIcon width="22" height="22" color="white" />
              </Flex>
              <Heading size="6" weight="bold" style={{ color: '#1e293b' }}>
                PothiGPT
              </Heading>
            </Flex>
          </Link>

          {/* Navigation Links - Hidden on mobile */}
          <Flex gap="1" className="hidden lg:flex">
            <a 
              href="#features" 
              className="px-4 py-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all font-medium"
              style={{ fontSize: '15px' }}
            >
              Features
            </a>
            <a 
              href="#how-it-works" 
              className="px-4 py-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all font-medium"
              style={{ fontSize: '15px' }}
            >
              How It Works
            </a>
            <a 
              href="#testimonials" 
              className="px-4 py-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all font-medium"
              style={{ fontSize: '15px' }}
            >
              Testimonials
            </a>
            <a 
              href="#faq" 
              className="px-4 py-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all font-medium"
              style={{ fontSize: '15px' }}
            >
              FAQ
            </a>
          </Flex>

          {/* Auth Buttons */}
          <Flex gap="3" align="center">
            <Button 
              size="3"
              variant="ghost" 
              color="gray" 
              asChild 
              className="!cursor-pointer hidden md:flex !font-medium"
            >
              <Link href="/login">
                <Text>Login</Text>
              </Link>
            </Button>
            <Button 
              size="3"
              variant="solid" 
              color="blue" 
              highContrast 
              asChild 
              className="!cursor-pointer !font-medium"
              style={{
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)'
              }}
            >
              <Link href="/signup">
                <Flex align="center" gap="2">
                  <RocketIcon width="16" height="16" />
                  <Text>Get Started</Text>
                </Flex>
              </Link>
            </Button>
          </Flex>
        </Flex>
      </Container>
    </Box>
  )
}

