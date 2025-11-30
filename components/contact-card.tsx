'use client'

import { useState } from 'react'
import { deleteContact } from '@/app/contacts/actions'

interface ContactCardProps {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  linked_user_id?: string | null
}

export default function ContactCard({
  id,
  name,
  email,
  phone,
  linked_user_id
}: ContactCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteContact(id)
      setShowConfirm(false)
    } catch (err) {
      console.error('Error deleting contact:', err)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="p-4 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-lg">{name}</h3>
            {linked_user_id && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Linked User
              </span>
            )}
          </div>

          <div className="space-y-1 text-sm">
            {email && (
              <p className="text-gray-600">
                <span className="text-gray-400">Email:</span> {email}
              </p>
            )}
            {phone && (
              <p className="text-gray-600">
                <span className="text-gray-400">Phone:</span> {phone}
              </p>
            )}
          </div>

          {!email && !phone && (
            <p className="text-xs text-gray-400 italic">No additional info</p>
          )}
        </div>

        <div className="flex gap-2 ml-4">
          <button
            onClick={() => setShowConfirm(true)}
            disabled={isDeleting}
            className="px-3 py-1 text-sm rounded bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>

      {showConfirm && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded flex items-center justify-between gap-3">
          <p className="text-sm text-red-700">Delete this contact?</p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowConfirm(false)}
              disabled={isDeleting}
              className="px-3 py-1 text-xs rounded border border-red-300 text-red-600 hover:bg-red-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-3 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
