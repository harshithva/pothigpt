'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/neopop/Card'
import { Button } from '@/components/ui/neopop/Button'
import { Input } from '@/components/ui/neopop/Input'

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-200 via-fuchsia-200 to-amber-200 p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black mb-2 text-gray-900">
            Create Your{' '}
            <span className="inline-block bg-fuchsia-400 px-3 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              Account
            </span>
          </h1>
          <p className="text-gray-800 text-lg font-semibold">Start creating professional ebooks today</p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit}>
            <Input
              label="Name"
              type="text"
              value={name}
              onChange={setName}
              placeholder="Your name"
              required
              autoFocus
            />

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="your@email.com"
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              required
            />

            <Input
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="••••••••"
              required
            />

            {error && (
              <div className="mb-4 p-4 bg-red-100 border-4 border-red-500 text-red-700">
                {error}
              </div>
            )}

            <div className="mb-6">
              <Button type="submit" fullWidth disabled={loading}>
                {loading ? 'Creating account...' : 'Sign Up'}
              </Button>
            </div>
          </form>

          <div className="text-center">
            <p className="text-gray-800 font-medium">
              Already have an account?{' '}
              <button
                onClick={() => router.push('/login')}
                className="font-bold underline hover:text-black text-gray-900"
              >
                Log in
              </button>
            </p>
          </div>
        </Card>

        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/')}
            className="text-gray-900 hover:text-black font-bold"
          >
            ← Back to home
          </button>
        </div>
      </div>
    </div>
  )
}

