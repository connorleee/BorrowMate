'use client'

import { useState, useEffect } from 'react'
import { searchContacts, createContact } from '@/app/contacts/actions'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface Contact {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  linked_user_id?: string | null
}

interface BatchLendModalProps {
  isOpen: boolean
  onClose: () => void
  selectedItemIds: string[]
  onLend: (contactId: string, dueDate?: string) => Promise<void>
}

export default function BatchLendModal({
  isOpen,
  onClose,
  selectedItemIds,
  onLend
}: BatchLendModalProps) {
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Contact[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dueDate, setDueDate] = useState('')

  // Mode for quick contact creation
  const [quickAddMode, setQuickAddMode] = useState(false)
  const [quickAddName, setQuickAddName] = useState('')
  const [quickAddEmail, setQuickAddEmail] = useState('')
  const [isCreatingQuick, setIsCreatingQuick] = useState(false)

  // Debounced search
  useEffect(() => {
    if (!isOpen) return

    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const delayDebounceFn = setTimeout(async () => {
      try {
        const results = await searchContacts(searchQuery)
        setSearchResults(results as Contact[])
      } catch (err) {
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery, isOpen])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedContactId(null)
      setSearchQuery('')
      setSearchResults([])
      setError(null)
      setDueDate('')
      setQuickAddMode(false)
      setQuickAddName('')
      setQuickAddEmail('')
    }
  }, [isOpen])

  const handleQuickAdd = async () => {
    if (!quickAddName.trim()) {
      setError('Contact name is required')
      return
    }

    setIsCreatingQuick(true)
    setError(null)

    try {
      const result = await createContact({
        name: quickAddName,
        email: quickAddEmail || null,
        phone: null,
      })
      if (result?.serverError) {
        setError(result.serverError)
      } else if (result?.data?.data) {
        setSelectedContactId(result.data.data.id)
        setQuickAddMode(false)
        setQuickAddName('')
        setQuickAddEmail('')
        setSearchQuery('')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create contact')
    } finally {
      setIsCreatingQuick(false)
    }
  }

  const handleSubmit = async () => {
    if (!selectedContactId) return

    setIsSubmitting(true)
    setError(null)

    try {
      await onLend(selectedContactId, dueDate || undefined)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to lend items')
    } finally {
      setIsSubmitting(false)
    }
  }

  const showSearchResults = searchQuery.length >= 2

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {/* Header */}
      <ModalHeader>
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">
            Lend {selectedItemIds.length} Item{selectedItemIds.length !== 1 ? 's' : ''}
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
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
      </ModalHeader>

      {/* Content */}
      <ModalBody className="space-y-4">
        {error && (
          <div className="bg-error-100 border border-error-200 text-error-800 dark:bg-error-900 dark:border-error-800 dark:text-error-200 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {!quickAddMode ? (
          <>
            {/* Search Bar */}
            <div>
              <Input
                type="text"
                placeholder="Search contacts by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={isSubmitting}
                autoFocus
              />
            </div>

            {/* Quick Add Button */}
            <button
              onClick={() => {
                setQuickAddMode(true)
                setError(null)
              }}
              disabled={isSubmitting}
              className="w-full py-2 px-3 border border-dashed border-primary-300 rounded-lg text-primary-600 hover:bg-primary-50 text-sm font-medium transition-colors"
            >
              + Create New Contact
            </button>

            {/* Contact List */}
            {isSearching ? (
              <div className="text-center py-8 text-[var(--text-tertiary)]">Searching...</div>
            ) : showSearchResults && searchResults.length === 0 ? (
              <div className="text-center py-8 text-[var(--text-tertiary)]">No contacts found</div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-2">
                {searchResults.map((contact) => (
                  <div
                    key={contact.id}
                    className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedContactId === contact.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-[var(--border)] hover:bg-[var(--bg-surface)]'
                    }`}
                    onClick={() => setSelectedContactId(contact.id)}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 flex-shrink-0 ${
                        selectedContactId === contact.id
                          ? 'border-primary-500 bg-primary-500'
                          : 'border-[var(--border)] bg-[var(--bg-base)]'
                      }`}
                    >
                      {selectedContactId === contact.id && (
                        <div className="w-2.5 h-2.5 rounded-full bg-[#ffffff]"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{contact.name}</div>
                      {contact.email && (
                        <div className="text-xs text-[var(--text-tertiary)]">{contact.email}</div>
                      )}
                    </div>
                    {contact.linked_user_id && (
                      <span className="ml-2 text-xs bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 px-2 py-1 rounded whitespace-nowrap">
                        Linked
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[var(--text-tertiary)] text-sm">
                <p>Search for an existing contact or create a new one.</p>
              </div>
            )}
          </>
        ) : (
          /* Quick Add Form */
          <div className="space-y-4">
            <h3 className="font-medium">Quick Add Contact</h3>

            <Input
              label="Name *"
              type="text"
              value={quickAddName}
              onChange={(e) => setQuickAddName(e.target.value)}
              placeholder="Contact name"
              disabled={isCreatingQuick}
              autoFocus
            />

            <Input
              label="Email"
              type="email"
              value={quickAddEmail}
              onChange={(e) => setQuickAddEmail(e.target.value)}
              placeholder="contact@example.com"
              disabled={isCreatingQuick}
            />

            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => setQuickAddMode(false)}
                disabled={isCreatingQuick}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleQuickAdd}
                disabled={isCreatingQuick || !quickAddName.trim()}
                className="flex-1"
              >
                {isCreatingQuick ? 'Creating...' : 'Add & Select'}
              </Button>
            </div>
          </div>
        )}

        {/* Due Date Picker */}
        {selectedContactId && !quickAddMode && (
          <div className="border-t border-[var(--border)] pt-4">
            <Input
              label="Due Date (Optional)"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        )}
      </ModalBody>

      {/* Footer */}
      <ModalFooter>
        <div className="flex justify-end gap-3">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedContactId || isSubmitting}
          >
            {isSubmitting ? 'Lending...' : 'Lend Items'}
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  )
}
