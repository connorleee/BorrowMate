'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { returnItem, batchLendToContact } from '@/app/borrow/actions'
import LendToContactModal from './lend-to-contact-modal'

interface Contact {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  linked_user_id?: string | null
  created_at: string
}

interface BorrowRecord {
  id: string
  item_id: string
  contact_id: string
  start_date: string
  due_date?: string | null
  returned_at?: string | null
  status: string
  created_at: string
  item: {
    id: string
    name: string
    description?: string | null
    category?: string | null
    status: string
  } | null
}

interface Stats {
  currentCount: number
  totalCount: number
}

interface ContactDetailContentProps {
  contact: Contact
  currentlyBorrowed: BorrowRecord[]
  history: BorrowRecord[]
  stats: Stats
}

export default function ContactDetailContent({
  contact,
  currentlyBorrowed,
  history,
  stats,
}: ContactDetailContentProps) {
  const router = useRouter()
  const [isReturning, setIsReturning] = useState<string | null>(null)
  const [isLendModalOpen, setIsLendModalOpen] = useState(false)
  const [isLending, setIsLending] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleReturn = async (record: BorrowRecord) => {
    if (!record.item) return

    setIsReturning(record.id)
    setFeedback(null)

    try {
      const result = await returnItem(record.id, record.item.id, '')
      if (result?.error) {
        setFeedback({ type: 'error', text: result.error })
      } else {
        setFeedback({ type: 'success', text: `${record.item.name} marked as returned` })
        router.refresh()
        setTimeout(() => setFeedback(null), 3000)
      }
    } catch (err) {
      setFeedback({ type: 'error', text: 'Failed to mark as returned' })
    } finally {
      setIsReturning(null)
    }
  }

  const handleLendItems = async (itemIds: string[], dueDate?: string) => {
    setIsLending(true)
    setFeedback(null)

    try {
      const result = await batchLendToContact(itemIds, contact.id, dueDate)
      if (result.error) {
        setFeedback({ type: 'error', text: result.error })
      } else {
        setFeedback({ type: 'success', text: `Lent ${itemIds.length} item${itemIds.length !== 1 ? 's' : ''} to ${contact.name}` })
        setIsLendModalOpen(false)
        router.refresh()
        setTimeout(() => setFeedback(null), 5000)
      }
    } catch (err) {
      setFeedback({ type: 'error', text: 'Failed to lend items' })
    } finally {
      setIsLending(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const isOverdue = (dueDate?: string | null) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {contact.name}
            </h1>
            <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
              {contact.email && <p>{contact.email}</p>}
              {contact.phone && <p>{contact.phone}</p>}
            </div>
            {contact.linked_user_id && (
              <span className="inline-block mt-2 text-xs bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 px-2 py-1 rounded">
                Linked User
              </span>
            )}
          </div>
          <button
            onClick={() => setIsLendModalOpen(true)}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-medium transition-colors"
          >
            Lend Items
          </button>
        </div>

        {/* Stats */}
        <div className="mt-6 flex gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {stats.currentCount}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Currently Borrowed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">
              {stats.totalCount}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Transactions</div>
          </div>
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-lg ${
            feedback.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300'
              : 'bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Currently Borrowed */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Currently Borrowed ({currentlyBorrowed.length})
        </h2>
        {currentlyBorrowed.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center text-gray-500 dark:text-gray-400">
            No items currently borrowed
          </div>
        ) : (
          <div className="space-y-3">
            {currentlyBorrowed.map((record) => (
              <div
                key={record.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center"
              >
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/items/${record.item?.id}`}
                    className="font-medium text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400"
                  >
                    {record.item?.name || 'Unknown Item'}
                  </Link>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Lent {formatDate(record.start_date)}
                    {record.due_date && (
                      <span className={isOverdue(record.due_date) ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
                        {' '}&middot; Due {formatDate(record.due_date)}
                        {isOverdue(record.due_date) && ' (Overdue)'}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleReturn(record)}
                  disabled={isReturning === record.id}
                  className="ml-4 px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
                >
                  {isReturning === record.id ? 'Returning...' : 'Return'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Borrow History */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          History ({history.length})
        </h2>
        {history.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center text-gray-500 dark:text-gray-400">
            No lending history yet
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((record) => (
              <div
                key={record.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <Link
                      href={`/items/${record.item?.id}`}
                      className="font-medium text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400"
                    >
                      {record.item?.name || 'Unknown Item'}
                    </Link>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {formatDate(record.start_date)} &rarr; {record.returned_at ? formatDate(record.returned_at) : 'N/A'}
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      record.status === 'returned'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : record.status === 'lost'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {record.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lend to Contact Modal */}
      <LendToContactModal
        isOpen={isLendModalOpen}
        onClose={() => setIsLendModalOpen(false)}
        onConfirm={handleLendItems}
        contactName={contact.name}
        isSubmitting={isLending}
      />
    </div>
  )
}
