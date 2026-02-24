'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from '@/components/ui'

interface Item {
  id: string
  name: string
  description?: string | null
  category?: string | null
}

interface LendToContactModalProps {
  isOpen: boolean
  onClose: () => void
  contactName: string
  onConfirm: (itemIds: string[], dueDate?: string) => Promise<void>
  isSubmitting?: boolean
}

export default function LendToContactModal({
  isOpen,
  onClose,
  contactName,
  onConfirm,
  isSubmitting = false,
}: LendToContactModalProps) {
  const [items, setItems] = useState<Item[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [dueDate, setDueDate] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Fetch available items when modal opens
  useEffect(() => {
    if (!isOpen) return

    const fetchItems = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setError('Not authenticated')
          return
        }

        const { data, error: fetchError } = await supabase
          .from('items')
          .select('id, name, description, category')
          .eq('owner_user_id', user.id)
          .eq('status', 'available')
          .is('group_id', null)
          .order('name')

        if (fetchError) {
          setError('Failed to load items')
          return
        }

        setItems(data || [])
      } catch {
        setError('Failed to load items')
      } finally {
        setIsLoading(false)
      }
    }

    fetchItems()
  }, [isOpen])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedItems(new Set())
      setDueDate('')
      setError(null)
    }
  }, [isOpen])

  const toggleItem = (itemId: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId)
    } else {
      newSelected.add(itemId)
    }
    setSelectedItems(newSelected)
  }

  const handleSubmit = async () => {
    if (selectedItems.size === 0) return
    await onConfirm(Array.from(selectedItems), dueDate || undefined)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      {/* Header */}
      <ModalHeader className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">
          Lend to {contactName}
        </h2>
        <button
          onClick={onClose}
          className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          disabled={isSubmitting}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </ModalHeader>

      {/* Content */}
      <ModalBody className="space-y-4">
        {error && (
          <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 text-error-700 dark:text-error-300 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-8 text-[var(--text-secondary)]">Loading items...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-8 text-[var(--text-secondary)]">
            No available items to lend
          </div>
        ) : (
          <>
            <p className="text-sm text-[var(--text-secondary)]">
              Select items to lend ({items.length} available)
            </p>
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedItems.has(item.id)
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-[var(--border)] hover:bg-[var(--bg-surface)]'
                  }`}
                  onClick={() => toggleItem(item.id)}
                >
                  <div
                    className={`w-5 h-5 rounded border flex items-center justify-center mr-3 flex-shrink-0 ${
                      selectedItems.has(item.id)
                        ? 'bg-primary-500 border-primary-500'
                        : 'border-[var(--border)] bg-[var(--bg-base)]'
                    }`}
                  >
                    {selectedItems.has(item.id) && (
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
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-[var(--text-primary)]">{item.name}</h3>
                    {item.description && (
                      <p className="text-sm text-[var(--text-secondary)] truncate">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Due Date */}
        {selectedItems.size > 0 && (
          <div className="border-t border-[var(--border)] pt-4">
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Due Date (Optional)
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-[var(--bg-base)] text-[var(--text-primary)]"
            />
          </div>
        )}
      </ModalBody>

      {/* Footer */}
      <ModalFooter className="flex justify-end gap-3">
        <Button
          variant="ghost"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={selectedItems.size === 0 || isSubmitting}
        >
          {isSubmitting
            ? 'Lending...'
            : `Lend ${selectedItems.size} Item${selectedItems.size !== 1 ? 's' : ''}`}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
