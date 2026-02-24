'use client'

import DeleteItemButton from './delete-item-button'
import { Badge } from '@/components/ui/badge'

interface LendableItemCardProps {
  item: {
    id: string
    name: string
    description?: string
    status: string
    groups?: { id: string; name: string } | null
  }
  isMultiSelectMode: boolean
  isSelected: boolean
  onToggleSelect: (itemId: string) => void
  onViewDetails?: (itemId: string) => void
}

export default function LendableItemCard({
  item,
  isMultiSelectMode,
  isSelected,
  onToggleSelect,
  onViewDetails
}: LendableItemCardProps) {
  const handleClick = () => {
    if (isMultiSelectMode) {
      onToggleSelect(item.id)
    } else if (onViewDetails) {
      onViewDetails(item.id)
    }
  }

  return (
    <div
      className={`bg-[var(--bg-surface)] p-5 rounded-lg shadow-sm border transition-colors ${isMultiSelectMode
        ? isSelected
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-500 cursor-pointer'
          : 'border-[var(--border)] hover:bg-[var(--bg-elevated)] cursor-pointer'
        : 'border-[var(--border)] cursor-pointer hover:border-primary-300 hover:shadow-md'
        }`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-3 flex-1">
          {isMultiSelectMode && (
            <div
              className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 ${isSelected
                ? 'bg-primary-500 border-primary-500'
                : 'border-[var(--border)] bg-[var(--bg-base)]'
                }`}
            >
              {isSelected && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              )}
            </div>
          )}
          <div className="flex-1">
            <h3 className="font-semibold text-base leading-snug text-[var(--text-primary)] mb-1">{item.name}</h3>
            <p className="text-xs text-[var(--text-tertiary)] mb-3 leading-relaxed">
              {item.description || 'No description'}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {item.groups ? (
                <Badge variant="neutral">{item.groups.name}</Badge>
              ) : (
                <Badge variant="warning">Unassigned</Badge>
              )}
              {item.status === 'unavailable' && (
                <Badge variant="error">Unavailable</Badge>
              )}
            </div>
          </div>
        </div>
        {!isMultiSelectMode && <DeleteItemButton itemId={item.id} />}
      </div>
    </div>
  )
}
