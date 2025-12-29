'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface Item {
  id: string
  name: string
  description?: string | null
  category?: string | null
}

interface BorrowRequestModalProps {
  isOpen: boolean
  onClose: () => void
  item: Item | null
  contactName: string
  onConfirm: (itemId: string, dueDate?: string, message?: string) => Promise<void>
  isSubmitting?: boolean
}

export default function BorrowRequestModal({
  isOpen,
  onClose,
  item,
  contactName,
  onConfirm,
  isSubmitting = false,
}: BorrowRequestModalProps) {
  const [dueDate, setDueDate] = useState('')
  const [message, setMessage] = useState('')

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setDueDate('')
      setMessage('')
    }
  }, [isOpen])

  const handleSubmit = async () => {
    if (!item) return
    await onConfirm(item.id, dueDate || undefined, message || undefined)
  }

  if (!isOpen || !item) return null
  if (typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Request to Borrow
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
        <div className="p-4 space-y-4">
          {/* Item Details */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{item.name}</h3>
            {item.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
            )}
            {item.category && (
              <span className="inline-block mt-2 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                {item.category}
              </span>
            )}
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400">
            Request to borrow this item from <span className="font-medium text-gray-900 dark:text-gray-100">{contactName}</span>
          </p>

          {/* Due Date */}
          <div>
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

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Message (Optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isSubmitting}
              rows={3}
              placeholder="Add a note to your request..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
            />
          </div>
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
            disabled={isSubmitting}
            className={`px-4 py-2 rounded-lg font-medium text-white transition-colors ${
              isSubmitting
                ? 'bg-primary-300 cursor-not-allowed'
                : 'bg-primary-500 hover:bg-primary-600'
            }`}
          >
            {isSubmitting ? 'Requesting...' : 'Request to Borrow'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
