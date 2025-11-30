'use client'

import React, { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, Button, TextField, Flex, Heading, Text, Callout, Box, Badge } from '@radix-ui/themes'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
      } else {
        router.push('/dashboard/books')
        router.refresh()
      }
    } catch (error) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box className="min-h-screen relative overflow-hidden" style={{
      background: 'linear-gradient(180deg, #eff6ff 0%, #dbeafe 50%, #ffffff 100%)'
    }}>
      {/* Decorative elements */}
      <Box className="absolute top-20 right-10 w-72 h-72 bg-blue-200 rounded-full opacity-20 blur-3xl" />
      <Box className="absolute bottom-20 left-10 w-96 h-96 bg-blue-300 rounded-full opacity-20 blur-3xl" />
      
      <Flex direction="column" align="center" justify="center" className="min-h-screen p-6 relative z-10">
        <Flex direction="column" gap="8" className="w-full max-w-md">
          {/* Header */}
          <Flex direction="column" align="center" gap="4" className="text-center">
            <Link href="/" className="no-underline">
              <Flex align="center" gap="2" className="hover:opacity-80 transition-opacity">
                <Box className="text-3xl">📚</Box>
                <Heading size="6" weight="bold" style={{ color: '#2563eb' }}>
                  PothiGPT
                </Heading>
              </Flex>
            </Link>
            
            <Badge size="2" color="blue" variant="soft" radius="full">
              Welcome back
            </Badge>
            
            <Heading 
              size="8" 
              weight="bold" 
              style={{ color: '#1e293b', lineHeight: '1.2' }}
            >
              Sign in to your account
            </Heading>
            
            <Text size="4" style={{ color: '#64748b' }}>
              Continue creating amazing ebooks with AI
            </Text>
          </Flex>

          {/* Login Card */}
          <Card 
            size="4" 
            style={{ 
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(37, 99, 235, 0.1)',
              boxShadow: '0 20px 60px rgba(37, 99, 235, 0.15)'
            }}
          >
            <form onSubmit={handleSubmit}>
              <Flex direction="column" gap="5" p="2">
                {/* Email Field */}
                <Box>
                  <label className="block mb-2">
                    <Text size="3" weight="bold" style={{ color: '#1e293b' }}>
                      Email Address
                    </Text>
                  </label>
                  <TextField.Root
                    size="3"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    autoFocus
                    variant="surface"
                    color="blue"
                  />
                </Box>

                {/* Password Field */}
                <Box>
                  <label className="block mb-2">
                    <Text size="3" weight="bold" style={{ color: '#1e293b' }}>
                      Password
                    </Text>
                  </label>
                  <TextField.Root
                    size="3"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    variant="surface"
                    color="blue"
                  />
                </Box>

                {/* Error Message */}
                {error && (
                  <Callout.Root color="red" size="1">
                    <Callout.Text>{error}</Callout.Text>
                  </Callout.Root>
                )}

                {/* Submit Button */}
                <Button 
                  size="4" 
                  variant="solid" 
                  color="blue" 
                  highContrast
                  type="submit" 
                  disabled={loading}
                  className="w-full !cursor-pointer shadow-glow-blue"
                  style={{ marginTop: '0.5rem' }}
                >
                  {loading ? 'Signing in...' : 'Sign in →'}
                </Button>

                {/* Divider */}
                <Flex align="center" gap="3" style={{ margin: '0.5rem 0' }}>
                  <Box style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                  <Text size="2" style={{ color: '#94a3b8' }}>or</Text>
                  <Box style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                </Flex>

                {/* Sign Up Link */}
                <Flex justify="center">
                  <Text size="3" style={{ color: '#64748b' }}>
                    Do not have an account?{' '}
                    <Link 
                      href="/signup" 
                      style={{ 
                        color: '#2563eb', 
                        fontWeight: 600,
                        textDecoration: 'none'
                      }}
                      className="hover:underline"
                    >
                      Create one
                    </Link>
                  </Text>
                </Flex>
              </Flex>
            </form>
          </Card>

          {/* Back to Home */}
          <Flex justify="center">
            <Button
              variant="ghost"
              size="3"
              onClick={() => router.push('/')}
              className="!cursor-pointer"
              style={{ color: '#64748b' }}
            >
              ← Back to home
            </Button>
          </Flex>
        </Flex>
      </Flex>
    </Box>
  )
}
