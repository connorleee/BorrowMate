'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { createContact } from '@/app/contacts/actions'

interface AddContactModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AddContactModal({ isOpen, onClose }: AddContactModalProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const formData = new FormData()
    formData.append('name', name)
    formData.append('email', email)
    formData.append('phone', phone)

    try {
      const result = await createContact(formData)
      if (result.error) {
        setError(result.error)
      } else {
        // Reset form and close modal on success
        setName('')
        setEmail('')
        setPhone('')
        onClose()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  if (typeof document === 'undefined') return null

  return createPortal(
    <div className="modal-overlay">
      <div className="modal-content w-full max-w-md p-6">
        <h2 className="text-2xl font-bold mb-4">Add Contact</h2>

        {error && (
          <div className="mb-4 p-3 bg-error-100 dark:bg-error-900 border border-error-200 dark:border-error-700 rounded text-error-700 dark:text-error-200 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contact name"
              className="input-field"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contact@example.com"
              className="input-field"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
              className="input-field"
              disabled={isLoading}
            />
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="btn-ghost flex-1 border dark:border-gray-600"
              style={{ borderColor: 'var(--border)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="btn-primary flex-1"
            >
              {isLoading ? 'Adding...' : 'Add Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
