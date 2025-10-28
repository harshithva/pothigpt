'use client'

import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
}

export const Card: React.FC<CardProps> = ({ children, className = '', hover = false }) => {
  return (
    <div 
      className={`
        bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]
        ${hover ? 'hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
}

