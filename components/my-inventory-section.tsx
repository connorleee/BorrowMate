'use client'

import { useState } from 'react'
import LendableItemCard from './lendable-item-card'
import BatchLendButton from './batch-lend-button'
import BatchLendModal from './batch-lend-modal'
import ItemDetailModal from './item-detail-modal'
import { batchLendToContact } from '@/app/borrow/actions'

interface Item {
  id: string
  name: string
  description?: string
  status: string
  groups?: { id: string; name: string } | null
}

interface MyInventorySectionProps {
  items: Item[]
}

interface FeedbackMessage {
  type: 'success' | 'error'
  text: string
  details?: string[]
}

export default function MyInventorySection({ items }: MyInventorySectionProps) {
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [isLendModalOpen, setIsLendModalOpen] = useState(false)
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<string | null>(null)
  const [feedbackMessage, setFeedbackMessage] = useState<FeedbackMessage | null>(null)

  // Filter to only personal items (no group_id and available)
  const personalItems = items.filter((item) => !item.groups && item.status === 'available')
  const hasPersonalItems = personalItems.length > 0

  const toggleMultiSelectMode = () => {
    setIsMultiSelectMode(!isMultiSelectMode)
    setSelectedItems(new Set())
    setFeedbackMessage(null)
  }

  const toggleItemSelection = (itemId: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId)
    } else {
      newSelected.add(itemId)
    }
    setSelectedItems(newSelected)
  }

  const handleContinueToLend = () => {
    if (selectedItems.size === 0) return
    setIsLendModalOpen(true)
  }

  const handleLendItems = async (contactId: string, dueDate?: string) => {
    try {
      const result = await batchLendToContact(Array.from(selectedItems), contactId, dueDate)

      if (result.error) {
        setFeedbackMessage({
          type: 'error',
          text: result.error
        })
        return
      }

      const itemCount = result.data?.length || selectedItems.size
      const successText = `Successfully lent ${itemCount} item${itemCount !== 1 ? 's' : ''}`

      setFeedbackMessage({
        type: 'success',
        text: successText
      })

      // Exit multi-select mode and clear selections
      setIsMultiSelectMode(false)
      setSelectedItems(new Set())
      setIsLendModalOpen(false)

      // Auto-dismiss success message after 5 seconds
      setTimeout(() => {
        setFeedbackMessage(null)
      }, 5000)
    } catch (error) {
      setFeedbackMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to lend items'
      })
    }
  }

  const handleCancel = () => {
    setIsMultiSelectMode(false)
    setSelectedItems(new Set())
    setFeedbackMessage(null)
  }

  return (
    <section>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-800">My Inventory</h2>
        {!isMultiSelectMode && (
          <BatchLendButton
            hasPersonalItems={hasPersonalItems}
            onToggleMultiSelect={toggleMultiSelectMode}
          />
        )}
      </div>

      {/* Selection Controls */}
      {isMultiSelectMode && (
        <div className="mb-4 p-4 bg-primary-50 border border-primary-200 rounded-lg flex justify-between items-center">
          <div className="font-medium text-primary-900">
            {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleContinueToLend}
              disabled={selectedItems.size === 0}
              className={`px-4 py-2 rounded-lg font-medium text-white transition-colors ${
                selectedItems.size === 0
                  ? 'bg-primary-300 cursor-not-allowed'
                  : 'bg-primary-500 hover:bg-primary-600'
              }`}
            >
              Continue to Lend
            </button>
          </div>
        </div>
      )}

      {/* Feedback Message */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-lg mb-4 ${
            feedbackMessage.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          <p className="font-medium">{feedbackMessage.text}</p>
          {feedbackMessage.details && feedbackMessage.details.length > 0 && (
            <div className="mt-2">
              <p className="font-medium text-sm mb-1">Failed to lend:</p>
              <ul className="text-sm list-disc list-inside space-y-1">
                {feedbackMessage.details.map((detail, i) => (
                  <li key={i}>{detail}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Items List */}
      {items.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500">
          You haven't added any items yet.
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const isPersonal = !item.groups
            const isAvailable = item.status === 'available'
            const isSelectable = isPersonal && isAvailable

            return (
              <LendableItemCard
                key={item.id}
                item={item}
                isMultiSelectMode={isMultiSelectMode && isSelectable}
                isSelected={selectedItems.has(item.id)}
                onToggleSelect={toggleItemSelection}
                onViewDetails={() => setSelectedItemForDetail(item.id)}
              />
            )
          })}
        </div>
      )}

      {/* Batch Lend Modal */}
      <BatchLendModal
        isOpen={isLendModalOpen}
        onClose={() => setIsLendModalOpen(false)}
        selectedItemIds={Array.from(selectedItems)}
        onLend={handleLendItems}
      />

      {/* Item Detail Modal */}
      {selectedItemForDetail && (
        <ItemDetailModal
          isOpen={!!selectedItemForDetail}
          onClose={() => setSelectedItemForDetail(null)}
          itemId={selectedItemForDetail}
        />
      )}
    </section>
  )
}
