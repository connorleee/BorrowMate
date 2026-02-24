'use client'

import { useState, useEffect } from 'react'
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Badge } from '@/components/ui'

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

  if (!item) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      {/* Header */}
      <ModalHeader className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">
          Request to Borrow
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
        {/* Item Details */}
        <div className="bg-[var(--bg-surface)] rounded-lg p-4">
          <h3 className="font-semibold text-[var(--text-primary)] mb-1">{item.name}</h3>
          {item.description && (
            <p className="text-sm text-[var(--text-secondary)]">{item.description}</p>
          )}
          {item.category && (
            <Badge variant="neutral" className="mt-2">
              {item.category}
            </Badge>
          )}
        </div>

        <p className="text-sm text-[var(--text-secondary)]">
          Request to borrow this item from <span className="font-medium text-[var(--text-primary)]">{contactName}</span>
        </p>

        {/* Due Date */}
        <div>
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

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            Message (Optional)
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isSubmitting}
            rows={3}
            placeholder="Add a note to your request..."
            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-[var(--bg-base)] text-[var(--text-primary)] resize-none"
          />
        </div>
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
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Requesting...' : 'Request to Borrow'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
