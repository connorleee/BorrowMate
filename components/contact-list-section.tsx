'use client'

import { useState, useEffect } from 'react'
import { searchContacts, deleteContact } from '@/app/contacts/actions'
import { ContactCard } from '@/components/Card'
import { Input, Button } from '@/components/ui'

interface Contact {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  linked_user_id?: string | null
}

interface ContactListSectionProps {
  initialContacts: Contact[]
}

export default function ContactListSection({ initialContacts }: ContactListSectionProps) {
  const [query, setQuery] = useState('')
  const [contacts, setContacts] = useState(initialContacts)
  const [isSearching, setIsSearching] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  useEffect(() => {
    if (!query.trim()) {
      setContacts(initialContacts)
      setIsSearching(false)
      return
    }

    // Set new timeout for debounced search (300ms)
    const timeout = setTimeout(async () => {
      setIsSearching(true)
      try {
        const results = await searchContacts(query)
        setContacts(results as Contact[])
      } catch (err) {
        // Error handled silently - search results unchanged
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => {
      clearTimeout(timeout)
    }
  }, [query, initialContacts])

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await deleteContact({ contactId: id })
      setContacts(contacts.filter(c => c.id !== id))
      setConfirmId(null)
    } catch (err) {
      // Error handled silently - UI state unchanged
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search contacts by name, email, or phone..."
          inputSize="lg"
        />
        {isSearching && (
          <div className="absolute right-3 top-3 text-[var(--text-tertiary)]">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
      </div>

      {contacts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-[var(--text-secondary)]">
            {query ? 'No contacts match your search.' : 'No contacts yet.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {contacts.map((contact) => (
            <div key={contact.id}>
              <ContactCard
                id={contact.id}
                name={contact.name}
                email={contact.email}
                phone={contact.phone}
                linkedUser={!!contact.linked_user_id}
                actions={
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setConfirmId(contact.id)}
                    disabled={deletingId === contact.id}
                  >
                    Delete
                  </Button>
                }
              />
              {confirmId === contact.id && (
                <div className="mt-2 p-3 bg-error-50 border border-error-200 rounded flex items-center justify-between gap-3">
                  <p className="text-sm text-error-700">Delete this contact?</p>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setConfirmId(null)}
                      disabled={deletingId === contact.id}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(contact.id)}
                      disabled={deletingId === contact.id}
                    >
                      {deletingId === contact.id ? 'Deleting...' : 'Delete'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
