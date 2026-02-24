'use client'

import { useState } from 'react'
import { ItemCard } from './Card'
import BatchLendButton from './batch-lend-button'
import BatchLendModal from './batch-lend-modal'
import ItemDetailModal from './item-detail-modal'
import { batchLendToContact } from '@/app/borrow/actions'
import DeleteItemButton from './delete-item-button'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/toast-provider'
import { EmptyState } from '@/components/empty-state'

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

export default function MyInventorySection({ items }: MyInventorySectionProps) {
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [isLendModalOpen, setIsLendModalOpen] = useState(false)
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<string | null>(null)
  const { addToast } = useToast()

  // Filter to only personal items (no group_id and available)
  const personalItems = items.filter((item) => !item.groups && item.status === 'available')
  const hasPersonalItems = personalItems.length > 0

  const toggleMultiSelectMode = () => {
    setIsMultiSelectMode(!isMultiSelectMode)
    setSelectedItems(new Set())
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
      const result = await batchLendToContact({ itemIds: Array.from(selectedItems), contactId, dueDate })

      if (result?.serverError) {
        addToast('error', result.serverError)
        return
      }

      const itemCount = result?.data?.data?.length || selectedItems.size
      addToast('success', `Successfully lent ${itemCount} item${itemCount !== 1 ? 's' : ''}`)

      // Exit multi-select mode and clear selections
      setIsMultiSelectMode(false)
      setSelectedItems(new Set())
      setIsLendModalOpen(false)
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Failed to lend items')
    }
  }

  const handleCancel = () => {
    setIsMultiSelectMode(false)
    setSelectedItems(new Set())
  }

  return (
    <section>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-[var(--text-primary)]">My Inventory</h2>
        {!isMultiSelectMode && (
          <BatchLendButton
            hasPersonalItems={hasPersonalItems}
            onToggleMultiSelect={toggleMultiSelectMode}
          />
        )}
      </div>

      {/* Selection Controls */}
      {isMultiSelectMode && (
        <div className="mb-4 p-4 bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 rounded-lg flex justify-between items-center">
          <div className="font-medium text-primary-900 dark:text-primary-100">
            {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              onClick={handleContinueToLend}
              disabled={selectedItems.size === 0}
            >
              Continue to Lend
            </Button>
          </div>
        </div>
      )}

      {/* Items List */}
      {items.length === 0 ? (
        <EmptyState
          message="Your inventory is empty"
          ctaLabel="Add Item"
          ctaHref="/items"
        />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => {
            const isPersonal = !item.groups
            const isAvailable = item.status === 'available'
            const isSelectable = isPersonal && isAvailable

            return (
              <ItemCard
                key={item.id}
                itemId={item.id}
                name={item.name}
                description={item.description}
                status={item.status}
                groupName={item.groups?.name}
                isMultiSelectMode={isMultiSelectMode && isSelectable}
                isSelected={selectedItems.has(item.id)}
                onToggleSelect={toggleItemSelection}
                onViewDetails={() => setSelectedItemForDetail(item.id)}
                deleteButton={!isMultiSelectMode && <DeleteItemButton itemId={item.id} />}
                className="h-full"
                variant="compact"
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
