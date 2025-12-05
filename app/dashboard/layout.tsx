'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button, Flex, Box, Text, Container, Heading, Avatar, Separator } from '@radix-ui/themes'
import { ReaderIcon, ExitIcon, PersonIcon, DownloadIcon } from '@radix-ui/react-icons'
import Link from 'next/link'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [globalDownloadFormat, setGlobalDownloadFormat] = useState<'pdf' | 'docx' | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<{ format?: 'pdf' | 'docx'; state?: 'started' | 'finished' }>
      const detail = customEvent.detail
      if (!detail?.format || !detail.state) return
      setGlobalDownloadFormat(detail.state === 'started' ? detail.format : null)
    }
    window.addEventListener('pothigpt-download-status', handler as EventListener)
    return () => window.removeEventListener('pothigpt-download-status', handler as EventListener)
  }, [])

  const showDownloadButtons = pathname?.startsWith('/dashboard/books/') && pathname?.endsWith('/edit')
  const isEditPage = pathname?.startsWith('/dashboard/books/') && pathname?.endsWith('/edit')

  const triggerNavbarDownload = (format: 'pdf' | 'docx') => {
    if (typeof window === 'undefined') return
    window.dispatchEvent(
      new CustomEvent('pothigpt-download', {
        detail: { format },
      })
    )
  }

  if (status === 'loading') {
    return (
      <Flex align="center" justify="center" className="min-h-screen" style={{
        background: 'linear-gradient(180deg, #eff6ff 0%, #dbeafe 50%, #ffffff 100%)'
      }}>
        <Text size="6" weight="bold" style={{ color: '#1e293b' }}>Loading...</Text>
      </Flex>
    )
  }

  if (!session) {
    return null
  }

  return (
    <Box className="min-h-screen" style={{ background: '#f8fafc' }}>
      {/* Header - Hidden on edit page */}
      {!isEditPage && (
        <Box 
          className="sticky top-0 z-50 backdrop-blur-xl bg-white/90 border-b"
          style={{
            borderColor: '#e0e7ff',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
          }}
        >
          <Container size="4">
            <Flex justify="between" align="center" py="3" px={{ initial: '4', md: '0' }}>
              {/* Logo & Nav */}
              <Flex align="center" gap="6">
                <Link href="/dashboard/books" className="no-underline">
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
                <Separator orientation="vertical" size="2" className="hidden md:block" style={{ height: '24px' }} />
                <nav className="hidden md:flex gap-1">
                  <Button
                    size="3"
                    variant="soft"
                    color="blue"
                    onClick={() => router.push('/dashboard/books')}
                    className="!cursor-pointer !font-medium"
                  >
                    My Books
                  </Button>
                  <Button
                    size="3"
                    variant="soft"
                    color="green"
                    onClick={() => router.push('/dashboard/books/upload')}
                    className="!cursor-pointer !font-medium"
                  >
                    Upload PDF
                  </Button>
                </nav>
              </Flex>

              {/* User Actions */}
              <Flex align="center" gap="4" style={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {/* User Info with Avatar */}
                <Flex align="center" gap="3" className="hidden sm:flex">
                  <Avatar
                    size="2"
                    fallback={
                      <PersonIcon width="16" height="16" />
                    }
                    radius="full"
                    color="blue"
                    variant="soft"
                  />
                  <Flex direction="column" gap="0">
                    <Text size="2" weight="bold" style={{ color: '#1e293b', lineHeight: '1.2' }}>
                      {session.user?.name || 'User'}
                    </Text>
                    <Text size="1" style={{ color: '#94a3b8', lineHeight: '1.2' }}>
                      {session.user?.email}
                    </Text>
                  </Flex>
                </Flex>

                <Separator orientation="vertical" size="2" className="hidden sm:block" style={{ height: '32px' }} />

                <Button
                  size="3"
                  variant="ghost"
                  color="red"
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="!cursor-pointer !font-medium"
                >
                  <Flex align="center" gap="2">
                    <ExitIcon width="16" height="16" />
                    <Text className="hidden sm:inline">Logout</Text>
                  </Flex>
                </Button>
              </Flex>
            </Flex>
          </Container>
        </Box>
      )}

      {/* Main Content */}
      <Box asChild>
        <main>
          {isEditPage ? (
            <Box style={{ padding: 0 }}>
              {children}
            </Box>
          ) : (
            <Container size="4" className="py-12">
              {children}
            </Container>
          )}
        </main>
      </Box>
    </Box>
  )
}
