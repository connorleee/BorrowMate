'use client'

import DeleteItemButton from './delete-item-button'

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
      className={`bg-white p-5 rounded-lg shadow-sm border transition-colors ${
        isMultiSelectMode
          ? isSelected
            ? 'border-primary-500 bg-primary-50 cursor-pointer'
            : 'border-gray-200 hover:bg-gray-50 cursor-pointer'
          : 'border-gray-200 cursor-pointer hover:border-primary-300 hover:shadow-md'
      }`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-3 flex-1">
          {isMultiSelectMode && (
            <div
              className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                isSelected
                  ? 'bg-primary-500 border-primary-500'
                  : 'border-gray-300 bg-white'
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
            <h3 className="font-semibold text-base leading-snug text-gray-900 mb-1">{item.name}</h3>
            <p className="text-xs text-gray-500 mb-3 leading-relaxed">
              {item.description || 'No description'}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {item.groups ? (
                <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded text-xs font-medium">
                  {item.groups.name}
                </span>
              ) : (
                <span className="bg-yellow-50 text-yellow-700 px-2.5 py-1 rounded border border-yellow-200 text-xs font-medium">
                  Unassigned
                </span>
              )}
              {item.status === 'unavailable' && (
                <span className="px-2.5 py-1 rounded bg-red-100 text-red-800 text-xs font-medium">
                  Unavailable
                </span>
              )}
            </div>
          </div>
        </div>
        {!isMultiSelectMode && <DeleteItemButton itemId={item.id} />}
      </div>
    </div>
  )
}
