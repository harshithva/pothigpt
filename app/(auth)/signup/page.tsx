'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Button, TextField, Flex, Heading, Text, Callout, Box, Badge } from '@radix-ui/themes'
import Link from 'next/link'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Something went wrong')
        setLoading(false)
        return
      }

      // Redirect to login
      router.push('/login?signup=success')
    } catch (error) {
      setError('Something went wrong. Please try again.')
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
            
            <Badge size="2" color="blue" variant="soft" radius="full" highContrast>
              🚀 Start your journey
            </Badge>
            
            <Heading 
              size="8" 
              weight="bold" 
              style={{ color: '#1e293b', lineHeight: '1.2' }}
            >
              Create your account
            </Heading>
            
            <Text size="4" style={{ color: '#64748b' }}>
              Join thousands of creators making ebooks with AI
            </Text>
          </Flex>

          {/* Signup Card */}
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
                {/* Name Field */}
                <Box>
                  <label className="block mb-2">
                    <Text size="3" weight="bold" style={{ color: '#1e293b' }}>
                      Full Name
                    </Text>
                  </label>
                  <TextField.Root
                    size="3"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    required
                    autoFocus
                    variant="surface"
                    color="blue"
                  />
                </Box>

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
                    placeholder="Minimum 8 characters"
                    required
                    variant="surface"
                    color="blue"
                  />
                  <Text size="1" style={{ color: '#94a3b8', marginTop: '0.25rem', display: 'block' }}>
                    Use 8 or more characters with a mix of letters and numbers
                  </Text>
                </Box>

                {/* Confirm Password Field */}
                <Box>
                  <label className="block mb-2">
                    <Text size="3" weight="bold" style={{ color: '#1e293b' }}>
                      Confirm Password
                    </Text>
                  </label>
                  <TextField.Root
                    size="3"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
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
                  {loading ? 'Creating account...' : 'Create account →'}
                </Button>

                {/* Divider */}
                <Flex align="center" gap="3" style={{ margin: '0.5rem 0' }}>
                  <Box style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                  <Text size="2" style={{ color: '#94a3b8' }}>or</Text>
                  <Box style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                </Flex>

                {/* Login Link */}
                <Flex justify="center">
                  <Text size="3" style={{ color: '#64748b' }}>
                    Already have an account?{' '}
                    <Link 
                      href="/login" 
                      style={{ 
                        color: '#2563eb', 
                        fontWeight: 600,
                        textDecoration: 'none'
                      }}
                      className="hover:underline"
                    >
                      Sign in
                    </Link>
                  </Text>
                </Flex>

                {/* Terms */}
                <Text size="2" align="center" style={{ color: '#94a3b8', marginTop: '0.5rem' }}>
                  By creating an account, you agree to our{' '}
                  <Link href="/terms" style={{ color: '#2563eb', textDecoration: 'none' }}>
                    Terms
                  </Link>
                  {' '}and{' '}
                  <Link href="/privacy" style={{ color: '#2563eb', textDecoration: 'none' }}>
                    Privacy Policy
                  </Link>
                </Text>
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
