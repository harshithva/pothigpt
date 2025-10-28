'use client'

import React, { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/neopop/Card'
import { Button } from '@/components/ui/neopop/Button'
import { Input } from '@/components/ui/neopop/Input'

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-200 via-fuchsia-200 to-amber-200 p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black mb-2 text-gray-900">
            Welcome{' '}
            <span className="inline-block bg-amber-400 px-3 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              Back
            </span>
          </h1>
          <p className="text-gray-800 text-lg font-semibold">Log in to continue creating amazing ebooks</p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit}>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="your@email.com"
              required
              autoFocus
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
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
                {loading ? 'Logging in...' : 'Log In'}
              </Button>
            </div>
          </form>

          <div className="text-center">
            <p className="text-gray-800 font-medium">
              Don't have an account?{' '}
              <button
                onClick={() => router.push('/signup')}
                className="font-bold underline hover:text-black text-gray-900"
              >
                Sign up
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

