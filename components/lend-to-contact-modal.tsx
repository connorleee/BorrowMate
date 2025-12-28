'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/utils/supabase/client'

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

  if (!isOpen) return null
  if (typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Lend to {contactName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
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
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading items...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No available items to lend
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Select items to lend ({items.length} available)
              </p>
              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedItems.has(item.id)
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => toggleItem(item.id)}
                  >
                    <div
                      className={`w-5 h-5 rounded border flex items-center justify-center mr-3 flex-shrink-0 ${
                        selectedItems.has(item.id)
                          ? 'bg-primary-500 border-primary-500'
                          : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
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
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">{item.name}</h3>
                      {item.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
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
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Due Date (Optional)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={selectedItems.size === 0 || isSubmitting}
            className={`px-4 py-2 rounded-lg font-medium text-white transition-colors ${
              selectedItems.size === 0 || isSubmitting
                ? 'bg-primary-300 cursor-not-allowed'
                : 'bg-primary-500 hover:bg-primary-600'
            }`}
          >
            {isSubmitting
              ? 'Lending...'
              : `Lend ${selectedItems.size} Item${selectedItems.size !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
