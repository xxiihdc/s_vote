'use client'

import { useState } from 'react'

interface CopyResultUrlButtonProps {
  resultUrl: string
}

export function CopyResultUrlButton({ resultUrl }: CopyResultUrlButtonProps) {
  const [copied, setCopied] = useState(false)

  async function onCopy() {
    await navigator.clipboard.writeText(resultUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button type="button" onClick={onCopy} aria-live="polite">
      {copied ? 'Copied' : 'Copy result URL'}
    </button>
  )
}
