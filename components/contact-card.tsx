'use client'

import { useState } from 'react'
import Link from 'next/link'
import { deleteContact } from '@/app/contacts/actions'
import { Button } from '@/components/ui'

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
      await deleteContact({ contactId: id })
      setShowConfirm(false)
    } catch (err) {
      // Error handled silently - UI state unchanged
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="p-4 border border-[var(--border)] rounded-lg bg-[var(--bg-base)] hover:bg-[var(--bg-surface)] transition-colors">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-lg">
              <Link href={`/contacts/${id}`} className="hover:text-primary-600 hover:underline">
                {name}
              </Link>
            </h3>
            {linked_user_id && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                Linked User
              </span>
            )}
          </div>

          <div className="space-y-1 text-sm">
            {email && (
              <p className="text-[var(--text-secondary)]">
                <span className="text-[var(--text-tertiary)]">Email:</span> {email}
              </p>
            )}
            {phone && (
              <p className="text-[var(--text-secondary)]">
                <span className="text-[var(--text-tertiary)]">Phone:</span> {phone}
              </p>
            )}
          </div>

          {!email && !phone && (
            <p className="text-xs text-[var(--text-tertiary)] italic">No additional info</p>
          )}
        </div>

        <div className="flex gap-2 ml-4">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowConfirm(true)}
            disabled={isDeleting}
          >
            Delete
          </Button>
        </div>
      </div>

      {showConfirm && (
        <div className="mt-3 p-3 bg-error-50 border border-error-200 rounded flex items-center justify-between gap-3">
          <p className="text-sm text-error-700">Delete this contact?</p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowConfirm(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
