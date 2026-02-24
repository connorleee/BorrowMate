'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { returnItem, batchLendToContact, createBorrowRequest } from '@/app/borrow/actions'
import LendToContactModal from './lend-to-contact-modal'
import BorrowRequestModal from './borrow-request-modal'
import { ItemCard } from './Card'
import { Button, Input, Badge, Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui'

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
  borrowedFromCount: number
  totalCount: number
}

interface PublicItem {
  id: string
  name: string
  description?: string | null
  category?: string | null
  status: string
}

interface PendingRequest {
  id: string
  item_id: string
  status: string
  created_at: string
}

interface ContactDetailContentProps {
  contact: Contact
  currentlyBorrowed: BorrowRecord[]
  borrowedFromContact: BorrowRecord[]
  history: BorrowRecord[]
  stats: Stats
  publicItems: PublicItem[]
  pendingRequests: PendingRequest[]
}

export default function ContactDetailContent({
  contact,
  currentlyBorrowed,
  borrowedFromContact,
  history,
  stats,
  publicItems,
  pendingRequests,
}: ContactDetailContentProps) {
  const router = useRouter()
  const [isReturning, setIsReturning] = useState<string | null>(null)
  const [isLendModalOpen, setIsLendModalOpen] = useState(false)
  const [isLending, setIsLending] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [confirmReturnRecord, setConfirmReturnRecord] = useState<BorrowRecord | null>(null)

  // Public items filtering state
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedItemForBorrow, setSelectedItemForBorrow] = useState<PublicItem | null>(null)
  const [isBorrowModalOpen, setIsBorrowModalOpen] = useState(false)
  const [isBorrowing, setIsBorrowing] = useState(false)

  const handleReturn = async (record: BorrowRecord) => {
    if (!record.item) return

    setIsReturning(record.id)
    setFeedback(null)

    try {
      const result = await returnItem({ recordId: record.id, itemId: record.item.id, groupId: '' })
      if (result?.serverError) {
        setFeedback({ type: 'error', text: result.serverError })
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
      const result = await batchLendToContact({ itemIds, contactId: contact.id, dueDate })
      if (result?.serverError) {
        setFeedback({ type: 'error', text: result.serverError })
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

  const handleBorrowRequest = async (itemId: string, dueDate?: string, message?: string) => {
    setIsBorrowing(true)
    setFeedback(null)

    try {
      const result = await createBorrowRequest({ itemId, contactId: contact.id, dueDate, message })
      if (result?.serverError) {
        setFeedback({ type: 'error', text: result.serverError })
      } else {
        setFeedback({ type: 'success', text: `Request sent! Waiting for ${contact.name} to accept your request for ${selectedItemForBorrow?.name}` })
        setIsBorrowModalOpen(false)
        setSelectedItemForBorrow(null)
        router.refresh()
        setTimeout(() => setFeedback(null), 5000)
      }
    } catch (err) {
      setFeedback({ type: 'error', text: 'Failed to send borrow request' })
    } finally {
      setIsBorrowing(false)
    }
  }

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Get unique categories from public items
  const categories = Array.from(new Set(publicItems.map(item => item.category).filter(Boolean))) as string[]

  // Filter public items
  const filteredPublicItems = publicItems.filter(item => {
    const matchesSearch = !debouncedSearch ||
      item.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      item.description?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      item.category?.toLowerCase().includes(debouncedSearch.toLowerCase())

    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter

    return matchesSearch && matchesCategory
  })

  const handleRequestBorrow = (item: PublicItem) => {
    setSelectedItemForBorrow(item)
    setIsBorrowModalOpen(true)
  }

  const hasPendingRequest = (itemId: string) => {
    return pendingRequests.some(req => req.item_id === itemId)
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
      <div className="bg-[var(--bg-base)] rounded-lg border border-[var(--border)] p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              {contact.name}
            </h1>
            <div className="mt-2 space-y-1 text-sm text-[var(--text-secondary)]">
              {contact.email && <p>{contact.email}</p>}
              {contact.phone && <p>{contact.phone}</p>}
            </div>
            {contact.linked_user_id && (
              <span className="inline-block mt-2 text-xs bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 px-2 py-1 rounded">
                Linked User
              </span>
            )}
          </div>
          <Button onClick={() => setIsLendModalOpen(true)}>
            Lend Items
          </Button>
        </div>

        {/* Stats */}
        <div className="mt-6 flex gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {stats.currentCount}
            </div>
            <div className="text-sm text-[var(--text-secondary)]">Your Items with {contact.name}</div>
          </div>
          {contact.linked_user_id && (
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.borrowedFromCount}
              </div>
              <div className="text-sm text-[var(--text-secondary)]">{contact.name}&apos;s Items with You</div>
            </div>
          )}
          <div className="text-center">
            <div className="text-2xl font-bold text-[var(--text-primary)]">
              {stats.totalCount}
            </div>
            <div className="text-sm text-[var(--text-secondary)]">Total Transactions</div>
          </div>
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-lg ${
            feedback.type === 'success'
              ? 'bg-success-50 border border-success-200 text-success-800 dark:bg-success-900/20 dark:border-success-800 dark:text-success-300'
              : 'bg-error-50 border border-error-200 text-error-800 dark:bg-error-900/20 dark:border-error-800 dark:text-error-300'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Items with Contact */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          Your Items with {contact.name} ({currentlyBorrowed.length})
        </h2>
        {currentlyBorrowed.length === 0 ? (
          <div className="bg-[var(--bg-surface)] rounded-lg p-6 text-center text-[var(--text-secondary)]">
            {contact.name} doesn&apos;t have any of your items
          </div>
        ) : (
          <div className="space-y-3">
            {currentlyBorrowed.map((record) => (
              <div
                key={record.id}
                className="bg-[var(--bg-base)] rounded-lg border border-[var(--border)] p-4 flex justify-between items-center"
              >
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/items/${record.item?.id}`}
                    className="font-medium text-[var(--text-primary)] hover:text-primary-600 dark:hover:text-primary-400"
                  >
                    {record.item?.name || 'Unknown Item'}
                  </Link>
                  <div className="text-sm text-[var(--text-secondary)] mt-1">
                    Lent {formatDate(record.start_date)}
                    {record.due_date && (
                      <span className={isOverdue(record.due_date) ? 'text-error-600 dark:text-error-400 font-medium' : ''}>
                        {' '}&middot; Due {formatDate(record.due_date)}
                        {isOverdue(record.due_date) && ' (Overdue)'}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => setConfirmReturnRecord(record)}
                  disabled={isReturning === record.id}
                  className="ml-4 bg-success-500 hover:bg-success-600 text-white"
                >
                  {isReturning === record.id ? 'Marking...' : 'Mark Returned'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Items Borrowed FROM Contact (only if contact is a linked user) */}
      {contact.linked_user_id && (
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            {contact.name}&apos;s Items with You ({borrowedFromContact.length})
          </h2>
          {borrowedFromContact.length === 0 ? (
            <div className="bg-[var(--bg-surface)] rounded-lg p-6 text-center text-[var(--text-secondary)]">
              You don&apos;t have any of {contact.name}&apos;s items
            </div>
          ) : (
            <div className="space-y-3">
              {borrowedFromContact.map((record) => (
                <div
                  key={record.id}
                  className="bg-[var(--bg-base)] rounded-lg border border-blue-200 dark:border-blue-700 p-4"
                >
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-[var(--text-primary)]">
                      {record.item?.name || 'Unknown Item'}
                    </span>
                    <div className="text-sm text-[var(--text-secondary)] mt-1">
                      Borrowed {formatDate(record.start_date)}
                      {record.due_date && (
                        <span className={isOverdue(record.due_date) ? 'text-error-600 dark:text-error-400 font-medium' : ''}>
                          {' '}&middot; Due {formatDate(record.due_date)}
                          {isOverdue(record.due_date) && ' (Overdue)'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Contact's Public Items (only if contact is a linked user and has public items) */}
      {contact.linked_user_id && publicItems.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            {contact.name}&apos;s Available Items ({filteredPublicItems.length})
          </h2>

          {/* Search and Filter Controls */}
          <div className="mb-4 flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="flex-1 relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <Input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            {categories.length > 0 && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-[var(--bg-base)] text-[var(--text-primary)]"
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Items Grid */}
          {filteredPublicItems.length === 0 ? (
            <div className="bg-[var(--bg-surface)] rounded-lg p-6 text-center text-[var(--text-secondary)]">
              No items found
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPublicItems.map((item) => (
                <div key={item.id} className="relative">
                  <ItemCard
                    itemId={item.id}
                    name={item.name}
                    description={item.description}
                    status={item.status}
                    variant="compact"
                    className="h-full"
                  />
                  {item.status === 'available' && (
                    hasPendingRequest(item.id) ? (
                      <Button
                        disabled
                        size="sm"
                        variant="secondary"
                        className="absolute bottom-3 right-3"
                      >
                        Request Sent
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleRequestBorrow(item)}
                        className="absolute bottom-3 right-3"
                      >
                        Request to Borrow
                      </Button>
                    )
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Borrow History */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          History ({history.length})
        </h2>
        {history.length === 0 ? (
          <div className="bg-[var(--bg-surface)] rounded-lg p-6 text-center text-[var(--text-secondary)]">
            No lending history yet
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((record) => (
              <div
                key={record.id}
                className="bg-[var(--bg-base)] rounded-lg border border-[var(--border)] p-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <Link
                      href={`/items/${record.item?.id}`}
                      className="font-medium text-[var(--text-primary)] hover:text-primary-600 dark:hover:text-primary-400"
                    >
                      {record.item?.name || 'Unknown Item'}
                    </Link>
                    <div className="text-sm text-[var(--text-secondary)] mt-1">
                      {formatDate(record.start_date)} &rarr; {record.returned_at ? formatDate(record.returned_at) : 'N/A'}
                    </div>
                  </div>
                  <Badge
                    variant={
                      record.status === 'returned'
                        ? 'success'
                        : record.status === 'lost'
                        ? 'error'
                        : 'neutral'
                    }
                  >
                    {record.status}
                  </Badge>
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

      {/* Borrow Request Modal */}
      <BorrowRequestModal
        isOpen={isBorrowModalOpen}
        onClose={() => {
          setIsBorrowModalOpen(false)
          setSelectedItemForBorrow(null)
        }}
        item={selectedItemForBorrow}
        contactName={contact.name}
        onConfirm={handleBorrowRequest}
        isSubmitting={isBorrowing}
      />

      {/* Confirm Return Modal */}
      <Modal isOpen={!!confirmReturnRecord} onClose={() => setConfirmReturnRecord(null)} size="sm">
        <ModalHeader>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            Confirm Return
          </h3>
        </ModalHeader>
        <ModalBody>
          <p className="text-[var(--text-secondary)]">
            Mark <span className="font-medium text-[var(--text-primary)]">{confirmReturnRecord?.item?.name}</span> as returned from {contact.name}?
          </p>
        </ModalBody>
        <ModalFooter className="flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => setConfirmReturnRecord(null)}
            disabled={!!confirmReturnRecord && isReturning === confirmReturnRecord.id}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 bg-success-500 hover:bg-success-600 text-white"
            onClick={async () => {
              if (confirmReturnRecord) {
                await handleReturn(confirmReturnRecord)
                setConfirmReturnRecord(null)
              }
            }}
            disabled={!!confirmReturnRecord && isReturning === confirmReturnRecord.id}
          >
            {confirmReturnRecord && isReturning === confirmReturnRecord.id ? 'Marking...' : 'Confirm'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
