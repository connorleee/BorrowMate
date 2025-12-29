'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { acceptBorrowRequest, rejectBorrowRequest } from '@/app/borrow/actions'

interface BorrowRequestCardProps {
  request: {
    id: string
    item: {
      id: string
      name: string
      description?: string | null
      category?: string | null
      status: string
    }
    requester: {
      id: string
      name: string
      email?: string
    }
    requested_due_date?: string | null
    message?: string | null
    created_at: string
  }
  onActionComplete?: () => void
}

export default function BorrowRequestCard({ request, onActionComplete }: BorrowRequestCardProps) {
  const router = useRouter()
  const [isAccepting, setIsAccepting] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleAccept = async () => {
    setIsAccepting(true)
    setFeedback(null)

    try {
      const result = await acceptBorrowRequest(request.id)
      if (result.error) {
        setFeedback({ type: 'error', text: result.error })
      } else {
        setFeedback({ type: 'success', text: `Request accepted! ${request.item.name} is now lent to ${request.requester.name}` })
        router.refresh()
        if (onActionComplete) {
          setTimeout(() => onActionComplete(), 1500)
        }
      }
    } catch (error) {
      setFeedback({ type: 'error', text: 'Failed to accept request' })
    } finally {
      setIsAccepting(false)
    }
  }

  const handleReject = async () => {
    setIsRejecting(true)
    setFeedback(null)

    try {
      const result = await rejectBorrowRequest(request.id)
      if (result.error) {
        setFeedback({ type: 'error', text: result.error })
      } else {
        setFeedback({ type: 'success', text: 'Request declined' })
        router.refresh()
        if (onActionComplete) {
          setTimeout(() => onActionComplete(), 1500)
        }
      }
    } catch (error) {
      setFeedback({ type: 'error', text: 'Failed to decline request' })
    } finally {
      setIsRejecting(false)
    }
  }

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
      {/* Requester Info */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {request.requester.name} wants to borrow:
          </p>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-1">
            {request.item.name}
          </h3>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-500">
          {getRelativeTime(request.created_at)}
        </span>
      </div>

      {/* Item Details */}
      {request.item.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {request.item.description}
        </p>
      )}

      {request.item.category && (
        <span className="inline-block text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
          {request.item.category}
        </span>
      )}

      {/* Request Details */}
      <div className="space-y-2 text-sm">
        {request.requested_due_date && (
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-500"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            <span className="text-gray-600 dark:text-gray-400">
              Requested return date: {formatDate(request.requested_due_date)}
            </span>
          </div>
        )}

        {request.message && (
          <div className="bg-gray-50 dark:bg-gray-900 rounded p-3">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              &quot;{request.message}&quot;
            </p>
          </div>
        )}
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          className={`p-3 rounded-lg text-sm ${
            feedback.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300'
              : 'bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Action Buttons */}
      {!feedback && (
        <div className="flex gap-3">
          <button
            onClick={handleAccept}
            disabled={isAccepting || isRejecting}
            className={`flex-1 px-4 py-2 rounded-lg font-medium text-white transition-colors ${
              isAccepting || isRejecting
                ? 'bg-green-300 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {isAccepting ? 'Accepting...' : 'Accept'}
          </button>
          <button
            onClick={handleReject}
            disabled={isAccepting || isRejecting}
            className={`flex-1 px-4 py-2 rounded-lg font-medium text-white transition-colors ${
              isAccepting || isRejecting
                ? 'bg-red-300 cursor-not-allowed'
                : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            {isRejecting ? 'Declining...' : 'Decline'}
          </button>
        </div>
      )}
    </div>
  )
}
