'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { getItemDetailsWithBorrow, getItemBorrowHistory, deleteItem } from '@/app/items/actions'
import { returnItem } from '@/app/borrow/actions'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/toast-provider'

interface ItemDetailModalProps {
  isOpen: boolean
  onClose: () => void
  itemId: string
}

export default function ItemDetailModal({ isOpen, onClose, itemId }: ItemDetailModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [isReturning, setIsReturning] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const { addToast } = useToast()

  // Fetch item details on open
  useEffect(() => {
    if (!isOpen || !itemId) return

    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        const result = await getItemDetailsWithBorrow(itemId)
        if (!result) {
          setError('Item not found')
          return
        }

        setData(result)

        // Fetch history if user is owner
        if (result.isOwner) {
          const historyData = await getItemBorrowHistory(itemId)
          setHistory(historyData || [])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load item details')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [isOpen, itemId])

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this item?')) return

    setIsDeleting(true)

    try {
      const result = await deleteItem({ itemId })
      if (result?.serverError) {
        addToast('error', result.serverError)
      } else {
        addToast('success', 'Item deleted')
        onClose()
      }
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to delete item')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleReturn = async () => {
    if (!data?.activeBorrow) return

    setIsReturning(true)

    try {
      const result = await returnItem({ recordId: data.activeBorrow.id, itemId, groupId: data.item.group_id || '' })
      if (result?.serverError) {
        addToast('error', result.serverError)
      } else {
        addToast('success', 'Item marked as returned')
        onClose()
      }
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to return item')
    } finally {
      setIsReturning(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6 overflow-y-auto max-h-[85vh]">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 pb-4 border-b border-[var(--border)]">
          <div className="flex-1">
            {loading ? (
              <div className="h-8 bg-[var(--bg-elevated)] rounded w-48 animate-pulse"></div>
            ) : (
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">{data?.item?.name}</h2>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] text-2xl leading-none"
            aria-label="Close"
          >
            &#x2715;
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-error-100 border border-error-200 rounded text-error-800 dark:bg-error-900 dark:border-error-800 dark:text-error-200 text-sm">
            {error}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            <div className="h-4 bg-[var(--bg-elevated)] rounded w-full animate-pulse"></div>
            <div className="h-4 bg-[var(--bg-elevated)] rounded w-3/4 animate-pulse"></div>
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* Status Badge */}
            <div className="flex gap-2">
              <Badge variant={data.item.status === 'available' ? 'success' : 'error'} size="md">
                {data.item.status === 'available' ? 'Available' : 'Unavailable'}
              </Badge>
              {data.item.privacy && (
                <Badge variant="info" size="md">
                  {data.item.privacy === 'private' ? 'Private' : 'Public'}
                </Badge>
              )}
            </div>

            {/* Description */}
            {data.item.description && (
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-1">Description</h3>
                <p className="text-[var(--text-secondary)]">{data.item.description}</p>
              </div>
            )}

            {/* Category */}
            {data.item.category && (
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-1">Category</h3>
                <p className="text-[var(--text-secondary)]">{data.item.category}</p>
              </div>
            )}

            {/* Owner Info */}
            <div className="bg-[var(--bg-surface)] p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-2">Owner</h3>
              <p className="text-[var(--text-primary)]">{data.item.users?.name || 'Unknown'}</p>
              {data.item.groups && (
                <p className="text-sm text-[var(--text-secondary)] mt-1">Group: {data.item.groups.name}</p>
              )}
            </div>

            {/* Current Borrow Status */}
            {data.activeBorrow && data.contact ? (
              <div className="bg-primary-50 dark:bg-primary-900/30 p-4 rounded-lg border border-primary-200 dark:border-primary-800">
                <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">Currently Borrowed By</h3>
                <div className="space-y-2">
                  <p className="text-[var(--text-primary)] font-medium">
                    <Link
                      href={`/contacts/${data.contact.id}`}
                      className="text-primary-600 hover:underline"
                      onClick={onClose}
                    >
                      {data.contact.name}
                    </Link>
                  </p>
                  {data.contact.email && (
                    <p className="text-sm text-[var(--text-secondary)]">Email: {data.contact.email}</p>
                  )}
                  {data.contact.phone && (
                    <p className="text-sm text-[var(--text-secondary)]">Phone: {data.contact.phone}</p>
                  )}
                  {data.activeBorrow.due_date && (
                    <p className="text-sm text-[var(--text-secondary)]">
                      Due: {new Date(data.activeBorrow.due_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              data.item.status === 'unavailable' && (
                <div className="bg-warning-50 dark:bg-warning-900/30 p-4 rounded-lg border border-warning-200 dark:border-warning-800">
                  <p className="text-warning-800 dark:text-warning-200 text-sm">This item is currently unavailable but borrow details could not be loaded.</p>
                </div>
              )
            )}

            {/* Advanced Info */}
            <div className="grid grid-cols-2 gap-4">
              {data.item.price_usd && (
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-1">Price</h3>
                  <p className="text-[var(--text-secondary)]">${data.item.price_usd}</p>
                </div>
              )}
              {data.item.qr_slug && (
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-1">QR Slug</h3>
                  <p className="text-[var(--text-secondary)] text-sm break-all">{data.item.qr_slug}</p>
                </div>
              )}
            </div>

            {/* Borrow History (Owner Only) */}
            {data.isOwner && history.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">Borrow History</h3>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {history.map((record, idx) => (
                    <div key={record.id || idx} className="p-3 bg-[var(--bg-surface)] rounded border border-[var(--border)]">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <p className="font-medium text-[var(--text-primary)]">
                            {record.contact?.id ? (
                              <Link
                                href={`/contacts/${record.contact.id}`}
                                className="text-primary-600 hover:underline"
                                onClick={onClose}
                              >
                                {record.contact.name}
                              </Link>
                            ) : (
                              record.contact?.name || 'Unknown'
                            )}
                          </p>
                          <p className="text-xs text-[var(--text-secondary)] mt-1">
                            {new Date(record.start_date).toLocaleDateString()}
                            {record.due_date && ` - Due: ${new Date(record.due_date).toLocaleDateString()}`}
                          </p>
                          {record.returned_at && (
                            <p className="text-xs text-[var(--text-secondary)]">
                              Returned: {new Date(record.returned_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <Badge
                          variant={
                            record.status === 'returned'
                              ? 'success'
                              : record.status === 'borrowed'
                                ? 'info'
                                : 'neutral'
                          }
                          size="sm"
                        >
                          {record.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Footer - Action Buttons */}
        <div className="flex gap-3 mt-8 pt-4 border-t border-[var(--border)]">
          {data?.isOwner ? (
            <>
              {data.item.status === 'unavailable' && data.activeBorrow && (
                <Button
                  onClick={handleReturn}
                  disabled={isReturning}
                  className="flex-1 bg-success-600 hover:bg-success-700"
                >
                  {isReturning ? 'Marking...' : 'Mark as Returned'}
                </Button>
              )}
              <Button
                onClick={() => setShowEditModal(true)}
                className="flex-1"
              >
                Edit Item
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </>
          ) : (
            <>
              {data?.item?.status === 'available' && (
                <Button className="flex-1">
                  Lend This Item
                </Button>
              )}
            </>
          )}
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            Close
          </Button>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && data?.isOwner && (
        <ItemEditSubModal
          item={data.item}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false)
            // Refresh item details
            window.location.reload()
          }}
        />
      )}
    </Modal>
  )
}

// Sub-modal for editing item details
function ItemEditSubModal({ item, onClose, onSuccess }: { item: any; onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState(item.name)
  const [description, setDescription] = useState(item.description || '')
  const [category, setCategory] = useState(item.category || '')
  const [price, setPrice] = useState(item.price_usd?.toString() || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { addToast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const { updateItem } = await import('@/app/items/actions')
      const result = await updateItem({
        itemId: item.id,
        name: name || item.name,
        description: description || undefined,
        category: category || undefined,
        price_usd: price ? parseFloat(price) : undefined,
      })

      if (result?.serverError) {
        addToast('error', result.serverError)
      } else {
        addToast('success', 'Item updated')
        onSuccess()
      }
    } catch (err) {
      addToast('error', err instanceof Error ? err.message : 'Failed to update item')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
      <div className="bg-[var(--bg-base)] rounded-lg shadow-lg w-full max-w-md p-6">
        <h3 className="text-xl font-bold mb-4 text-[var(--text-primary)]">Edit Item</h3>

        {error && (
          <div className="mb-4 p-3 bg-error-100 border border-error-200 rounded text-error-800 dark:bg-error-900 dark:border-error-800 dark:text-error-200 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSubmitting}
          />

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--bg-base)] text-[var(--text-primary)] focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <Input
            label="Category"
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={isSubmitting}
          />

          <Input
            label="Price (USD)"
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            disabled={isSubmitting}
          />

          <div className="flex gap-3 mt-6">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
