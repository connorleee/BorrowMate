'use client'

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
    <button
      onClick={onToggleMultiSelect}
      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
    >
      Lend Items
    </button>
  )
}
