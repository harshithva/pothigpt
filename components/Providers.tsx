'use client'

import { SessionProvider } from 'next-auth/react'
import { Theme } from '@radix-ui/themes'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Theme accentColor="blue" grayColor="gray" radius="medium" scaling="100%">
      <SessionProvider>{children}</SessionProvider>
    </Theme>
  )
}

