'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { searchContacts, createContact } from '@/app/contacts/actions'

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
        console.error('Error searching contacts:', err)
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
      const formData = new FormData()
      formData.append('name', quickAddName)
      formData.append('email', quickAddEmail)

      const result = await createContact(formData)
      if (result.error) {
        setError(result.error)
      } else if (result.data) {
        setSelectedContactId(result.data.id)
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

  if (!isOpen) return null

  if (typeof document === 'undefined') return null

  const showSearchResults = searchQuery.length >= 2

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">
            Lend {selectedItemIds.length} Item{selectedItemIds.length !== 1 ? 's' : ''}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
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
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {!quickAddMode ? (
            <>
              {/* Search Bar */}
              <div>
                <input
                  type="text"
                  placeholder="Search contacts by name, email, or phone..."
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                <div className="text-center py-8 text-gray-500">Searching...</div>
              ) : showSearchResults && searchResults.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No contacts found</div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-2">
                  {searchResults.map((contact) => (
                    <div
                      key={contact.id}
                      className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedContactId === contact.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedContactId(contact.id)}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 flex-shrink-0 ${
                          selectedContactId === contact.id
                            ? 'border-primary-500 bg-primary-500'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {selectedContactId === contact.id && (
                          <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{contact.name}</div>
                        {contact.email && (
                          <div className="text-xs text-gray-500">{contact.email}</div>
                        )}
                      </div>
                      {contact.linked_user_id && (
                        <span className="ml-2 text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded whitespace-nowrap">
                          Linked
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 text-sm">
                  <p>Search for an existing contact or create a new one.</p>
                </div>
              )}
            </>
          ) : (
            /* Quick Add Form */
            <div className="space-y-4">
              <h3 className="font-medium">Quick Add Contact</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={quickAddName}
                  onChange={(e) => setQuickAddName(e.target.value)}
                  placeholder="Contact name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  disabled={isCreatingQuick}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={quickAddEmail}
                  onChange={(e) => setQuickAddEmail(e.target.value)}
                  placeholder="contact@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  disabled={isCreatingQuick}
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setQuickAddMode(false)}
                  disabled={isCreatingQuick}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleQuickAdd}
                  disabled={isCreatingQuick || !quickAddName.trim()}
                  className="flex-1 px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-sm font-medium disabled:opacity-50"
                >
                  {isCreatingQuick ? 'Creating...' : 'Add & Select'}
                </button>
              </div>
            </div>
          )}

          {/* Due Date Picker */}
          {selectedContactId && !quickAddMode && (
            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date (Optional)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedContactId || isSubmitting}
            className={`px-4 py-2 rounded-lg font-medium text-white transition-colors ${
              !selectedContactId || isSubmitting
                ? 'bg-primary-300 cursor-not-allowed'
                : 'bg-primary-500 hover:bg-primary-600'
            }`}
          >
            {isSubmitting ? 'Lending...' : 'Lend Items'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
