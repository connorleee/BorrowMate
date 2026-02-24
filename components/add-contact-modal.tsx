'use client'

import { useState } from 'react'
import { createContact } from '@/app/contacts/actions'
import { Modal, ModalHeader, ModalBody, ModalFooter, Input, Button } from '@/components/ui'

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

    try {
      const result = await createContact({
        name,
        email: email || null,
        phone: phone || null,
      })
      if (result?.serverError) {
        setError(result.serverError)
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <form onSubmit={handleSubmit}>
        <ModalHeader>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Add Contact</h2>
        </ModalHeader>

        <ModalBody className="space-y-4">
          {error && (
            <div className="p-3 bg-error-100 dark:bg-error-900 border border-error-200 dark:border-error-700 rounded text-error-700 dark:text-error-200 text-sm">
              {error}
            </div>
          )}

          <Input
            label="Name *"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contact name"
            required
            disabled={isLoading}
            inputSize="lg"
          />

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="contact@example.com"
            disabled={isLoading}
            inputSize="lg"
          />

          <Input
            label="Phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(555) 123-4567"
            disabled={isLoading}
            inputSize="lg"
          />
        </ModalBody>

        <ModalFooter className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={isLoading || !name.trim()}
          >
            {isLoading ? 'Adding...' : 'Add Contact'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
