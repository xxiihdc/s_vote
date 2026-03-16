'use client'

import React from 'react'
import { useState } from 'react'

interface CopyResultUrlButtonProps {
  resultUrl: string
  label?: string
}

export function CopyResultUrlButton({ resultUrl, label = 'Copy result URL' }: CopyResultUrlButtonProps) {
  const [copied, setCopied] = useState(false)

  async function onCopy() {
    await navigator.clipboard.writeText(resultUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button className="btn" type="button" onClick={onCopy} aria-live="polite">
      {copied ? 'Copied' : label}
    </button>
  )
}
