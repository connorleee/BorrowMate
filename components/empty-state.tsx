'use client'

import Link from 'next/link'
import { Button } from '@/components/ui'

interface EmptyStateProps {
  message: string
  ctaLabel: string
  ctaHref?: string
  onCtaClick?: () => void
}

export function EmptyState({ message, ctaLabel, ctaHref, onCtaClick }: EmptyStateProps) {
  const button = (
    <Button variant="primary" size="md" onClick={onCtaClick}>
      {ctaLabel}
    </Button>
  )

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 px-6 border-2 border-dashed border-[var(--border)] rounded-lg">
      <p className="text-[var(--text-secondary)] text-sm text-center max-w-xs">
        {message}
      </p>
      {ctaHref ? <Link href={ctaHref}>{button}</Link> : button}
    </div>
  )
}
