'use client'

import DeleteItemButton from './delete-item-button'

interface LendableItemCardProps {
  item: {
    id: string
    name: string
    description?: string
    visibility: string
    status: string
    groups?: { id: string; name: string } | null
  }
  isMultiSelectMode: boolean
  isSelected: boolean
  onToggleSelect: (itemId: string) => void
}

export default function LendableItemCard({
  item,
  isMultiSelectMode,
  isSelected,
  onToggleSelect
}: LendableItemCardProps) {
  const handleClick = () => {
    if (isMultiSelectMode) {
      onToggleSelect(item.id)
    }
  }

  return (
    <div
      className={`bg-white p-4 rounded-lg shadow-sm border transition-colors ${
        isMultiSelectMode
          ? isSelected
            ? 'border-blue-500 bg-blue-50 cursor-pointer'
            : 'border-gray-200 hover:bg-gray-50 cursor-pointer'
          : 'border-gray-200'
      }`}
      onClick={handleClick}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-3 flex-1">
          {isMultiSelectMode && (
            <div
              className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 mt-1 ${
                isSelected
                  ? 'bg-blue-500 border-blue-500'
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
            <h3 className="font-medium text-lg">{item.name}</h3>
            <p className="text-sm text-gray-500 mb-2">
              {item.description || 'No description'}
            </p>
            <div className="flex gap-2 text-xs">
              {item.groups ? (
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  {item.groups.name}
                </span>
              ) : (
                <span className="bg-yellow-50 text-yellow-700 px-2 py-1 rounded border border-yellow-200">
                  Unassigned
                </span>
              )}
              <span
                className={`px-2 py-1 rounded ${
                  item.visibility === 'shared'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {item.visibility === 'shared' ? 'Shared' : 'Personal'}
              </span>
              {item.status === 'unavailable' && (
                <span className="px-2 py-1 rounded bg-red-100 text-red-800">
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
