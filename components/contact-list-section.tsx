'use client'

import { useState, useEffect } from 'react'
import { searchContacts, deleteContact } from '@/app/contacts/actions'
import { ContactCard } from '@/components/Card'

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
        console.error('Error searching contacts:', err)
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
      await deleteContact(id)
      setContacts(contacts.filter(c => c.id !== id))
      setConfirmId(null)
    } catch (err) {
      console.error('Error deleting contact:', err)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search contacts by name, email, or phone..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
        />
        {isSearching && (
          <div className="absolute right-3 top-3 text-gray-400">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
      </div>

      {contacts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">
            {query ? 'No contacts match your search.' : 'No contacts yet.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {contacts.map((contact) => (
            <div key={contact.id}>
              <ContactCard
                name={contact.name}
                email={contact.email}
                phone={contact.phone}
                linkedUser={!!contact.linked_user_id}
                actions={
                  <button
                    onClick={() => setConfirmId(contact.id)}
                    disabled={deletingId === contact.id}
                    className="px-3 py-1 text-sm rounded bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    Delete
                  </button>
                }
              />
              {confirmId === contact.id && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded flex items-center justify-between gap-3">
                  <p className="text-sm text-red-700">Delete this contact?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmId(null)}
                      disabled={deletingId === contact.id}
                      className="px-3 py-1 text-xs rounded border border-red-300 text-red-600 hover:bg-red-100 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDelete(contact.id)}
                      disabled={deletingId === contact.id}
                      className="px-3 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      {deletingId === contact.id ? 'Deleting...' : 'Delete'}
                    </button>
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
