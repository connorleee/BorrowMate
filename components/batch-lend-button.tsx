'use client'

import { Button } from '@/components/ui/button'

interface BatchLendButtonProps {
  hasPersonalItems: boolean
  onToggleMultiSelect: () => void
}

export default function BatchLendButton({
  hasPersonalItems,
  onToggleMultiSelect
}: BatchLendButtonProps) {
  if (!hasPersonalItems) return null

  return (
    <Button onClick={onToggleMultiSelect}>
      Lend Items
    </Button>
  )
}
