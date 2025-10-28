'use client'

import React from 'react'

interface TagProps {
  children: React.ReactNode
  color?: 'green' | 'yellow' | 'red' | 'blue'
}

export const Tag: React.FC<TagProps> = ({ children, color = 'blue' }) => {
  const colorMap = {
    green: 'bg-emerald-400 border-emerald-900 text-emerald-900',
    yellow: 'bg-amber-400 border-amber-900 text-amber-900',
    red: 'bg-rose-400 border-rose-900 text-rose-900',
    blue: 'bg-cyan-400 border-cyan-900 text-cyan-900',
  }

  return (
    <span
      className={`inline-block px-3 py-1 text-xs font-black uppercase border-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${colorMap[color]}`}
    >
      {children}
    </span>
  )
}

