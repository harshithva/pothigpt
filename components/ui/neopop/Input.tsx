'use client'

import React from 'react'
import { InputField } from '@cred/neopop-web/lib/components'

interface InputProps {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  placeholder?: string
  error?: string
  required?: boolean
  autoFocus?: boolean
}

export const Input: React.FC<InputProps> = ({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  error,
  required = false,
  autoFocus = false,
}) => {
  return (
    <div className="mb-4 [&_input]:!text-gray-900 [&_input]:!placeholder-gray-500">
      <InputField
        label={label}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        colorConfig={{
          labelColor: '#000000',
          inputColor: '#000000',
          caretColor: '#000000',
          errorColor: '#FF3B30',
          focusColor: '#0A84FF',
        }}
        errorMessage={error}
        autoFocus={autoFocus}
      />
    </div>
  )
}

