'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/neopop/Button'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-100 to-fuchsia-100">
        <div className="text-2xl font-bold text-gray-900">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-100 via-fuchsia-100 to-amber-100">
      {/* Header */}
      <header className="bg-black border-b-8 border-amber-400 shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <h1 className="text-2xl font-black text-amber-400">
                PothiGPT
              </h1>
              <nav className="hidden md:flex gap-6">
                <button
                  onClick={() => router.push('/dashboard/books')}
                  className="text-white hover:text-amber-400 font-bold transition-colors"
                >
                  My Books
                </button>
                {/* <button
                  onClick={() => router.push('/admin/questionnaires')}
                  className="text-white hover:text-amber-400 font-bold transition-colors"
                >
                  Questionnaires
                </button> */}
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-white font-bold hidden sm:inline">
                {session.user?.name || session.user?.email}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="px-4 py-2 bg-white text-black font-black border-2 border-white hover:bg-amber-400 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}

