'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { getItemDetailsWithBorrow, getItemBorrowHistory, deleteItem } from '@/app/items/actions'
import { returnItem } from '@/app/borrow/actions'

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
    setError(null)

    try {
      const result = await deleteItem(itemId)
      if (result.error) {
        setError(result.error)
      } else {
        onClose()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleReturn = async () => {
    if (!data?.activeBorrow) return

    setIsReturning(true)
    setError(null)

    try {
      await returnItem(data.activeBorrow.id, itemId, data.item.group_id || '')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to return item')
    } finally {
      setIsReturning(false)
    }
  }

  if (!isOpen) return null
  if (typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 pb-4 border-b">
          <div className="flex-1">
            {loading ? (
              <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
            ) : (
              <h2 className="text-2xl font-bold text-gray-900">{data?.item?.name}</h2>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* Status Badge */}
            <div className="flex gap-2">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${data.item.status === 'available'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
                  }`}
              >
                {data.item.status === 'available' ? 'Available' : 'Unavailable'}
              </span>
              {data.item.privacy && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
                  {data.item.privacy === 'private' ? 'Private' : 'Public'}
                </span>
              )}
            </div>

            {/* Description */}
            {data.item.description && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-1">Description</h3>
                <p className="text-gray-600">{data.item.description}</p>
              </div>
            )}

            {/* Category */}
            {data.item.category && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-1">Category</h3>
                <p className="text-gray-600">{data.item.category}</p>
              </div>
            )}

            {/* Owner Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Owner</h3>
              <p className="text-gray-900">{data.item.users?.name || 'Unknown'}</p>
              {data.item.groups && (
                <p className="text-sm text-gray-600 mt-1">Group: {data.item.groups.name}</p>
              )}
            </div>

            {/* Current Borrow Status */}
            {data.activeBorrow && data.contact ? (
              <div className="bg-primary-50 p-4 rounded-lg border border-primary-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Currently Borrowed By</h3>
                <div className="space-y-2">
                  <p className="text-gray-900 font-medium">{data.contact.name}</p>
                  {data.contact.email && (
                    <p className="text-sm text-gray-600">Email: {data.contact.email}</p>
                  )}
                  {data.contact.phone && (
                    <p className="text-sm text-gray-600">Phone: {data.contact.phone}</p>
                  )}
                  {data.activeBorrow.due_date && (
                    <p className="text-sm text-gray-600">
                      Due: {new Date(data.activeBorrow.due_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              data.item.status === 'unavailable' && (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <p className="text-yellow-800 text-sm">This item is currently unavailable but borrow details could not be loaded.</p>
                </div>
              )
            )}

            {/* Advanced Info */}
            <div className="grid grid-cols-2 gap-4">
              {data.item.price_usd && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">Price</h3>
                  <p className="text-gray-600">${data.item.price_usd}</p>
                </div>
              )}
              {data.item.qr_slug && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">QR Slug</h3>
                  <p className="text-gray-600 text-sm break-all">{data.item.qr_slug}</p>
                </div>
              )}
            </div>

            {/* Borrow History (Owner Only) */}
            {data.isOwner && history.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Borrow History</h3>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {history.map((record, idx) => (
                    <div key={record.id || idx} className="p-3 bg-gray-50 rounded border border-gray-200">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{record.contact?.name || 'Unknown'}</p>
                          <p className="text-xs text-gray-600 mt-1">
                            {new Date(record.start_date).toLocaleDateString()}
                            {record.due_date && ` - Due: ${new Date(record.due_date).toLocaleDateString()}`}
                          </p>
                          {record.returned_at && (
                            <p className="text-xs text-gray-600">
                              Returned: {new Date(record.returned_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded whitespace-nowrap ${record.status === 'returned'
                            ? 'bg-success-100 text-success-800'
                            : record.status === 'borrowed'
                              ? 'bg-info-100 text-info-800'
                              : 'bg-gray-100 text-gray-800'
                            }`}
                        >
                          {record.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Footer - Action Buttons */}
        <div className="flex gap-3 mt-8 pt-4 border-t">
          {data?.isOwner ? (
            <>
              {data.item.status === 'unavailable' && data.activeBorrow && (
                <button
                  onClick={handleReturn}
                  disabled={isReturning}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isReturning ? 'Marking...' : 'Mark as Returned'}
                </button>
              )}
              <button
                onClick={() => setShowEditModal(true)}
                className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
              >
                Edit Item
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </>
          ) : (
            <>
              {data?.item?.status === 'available' && (
                <button className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors">
                  Lend This Item
                </button>
              )}
            </>
          )}
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
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
    </div>,
    document.body
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const { updateItem } = await import('@/app/items/actions')
      const result = await updateItem(item.id, {
        name: name || item.name,
        description: description || undefined,
        category: category || undefined,
        price_usd: price ? parseFloat(price) : undefined,
      })

      if (result.error) {
        setError(result.error)
      } else {
        onSuccess()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <h3 className="text-xl font-bold mb-4">Edit Item</h3>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price (USD)</label>
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
