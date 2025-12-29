'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { markNotificationAsRead, dismissNotification } from '@/app/notifications/actions'
import { acceptBorrowRequest, rejectBorrowRequest } from '@/app/borrow/actions'

interface NotificationItemProps {
  notification: any
  onRead: (notificationId: string) => void
  onDismiss: (notificationId: string) => void
  onClose: () => void
}

export default function NotificationItem({ notification, onRead, onDismiss, onClose }: NotificationItemProps) {
  const router = useRouter()
  const [isAccepting, setIsAccepting] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [isDismissing, setIsDismissing] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  const handleDismiss = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsDismissing(true)

    const result = await dismissNotification(notification.id)
    if (!result.error) {
      onDismiss(notification.id)
    }
    setIsDismissing(false)
  }

  const handleClick = async () => {
    // For borrow_request notifications, toggle expanded view
    if (notification.type === 'borrow_request' && notification.related_request?.status === 'pending') {
      setIsExpanded(!isExpanded)

      // Mark as read if unread
      if (notification.status === 'unread') {
        await markNotificationAsRead(notification.id)
        onRead(notification.id)
      }
      return
    }

    // For other notifications, navigate as before
    if (notification.status === 'unread') {
      await markNotificationAsRead(notification.id)
      onRead(notification.id)
    }

    if (notification.action_url) {
      router.push(notification.action_url)
      onClose()
    }
  }

  const handleAccept = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsAccepting(true)
    setFeedback(null)

    try {
      const result = await acceptBorrowRequest(notification.related_request_id)
      if (result.error) {
        setFeedback({ type: 'error', text: result.error })
      } else {
        setFeedback({ type: 'success', text: 'Request accepted!' })
        router.refresh()
        setTimeout(() => {
          onClose()
        }, 1500)
      }
    } catch (error) {
      setFeedback({ type: 'error', text: 'Failed to accept request' })
    } finally {
      setIsAccepting(false)
    }
  }

  const handleReject = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsRejecting(true)
    setFeedback(null)

    try {
      const result = await rejectBorrowRequest(notification.related_request_id)
      if (result.error) {
        setFeedback({ type: 'error', text: result.error })
      } else {
        setFeedback({ type: 'success', text: 'Request declined' })
        router.refresh()
        setTimeout(() => {
          onClose()
        }, 1500)
      }
    } catch (error) {
      setFeedback({ type: 'error', text: 'Failed to decline request' })
    } finally {
      setIsRejecting(false)
    }
  }

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  const getIcon = () => {
    switch (notification.type) {
      case 'borrow_request':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-blue-500"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        )
      case 'request_accepted':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-green-500"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        )
      case 'request_rejected':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-red-500"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        )
      default:
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-gray-500"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        )
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

  const isBorrowRequest = notification.type === 'borrow_request'
  const isPendingRequest = isBorrowRequest && notification.related_request?.status === 'pending'

  return (
    <div
      className={`w-full ${
        notification.status === 'unread' ? 'bg-blue-50 dark:bg-blue-900/10' : ''
      }`}
    >
      <button
        onClick={handleClick}
        className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 mt-1">
            {getIcon()}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                {notification.title}
              </p>
              <div className="flex items-center gap-2 flex-shrink-0">
                {notification.status === 'unread' && (
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                )}
                <button
                  onClick={handleDismiss}
                  disabled={isDismissing}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                  title="Dismiss"
                >
                  {isDismissing ? (
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {notification.message && !isExpanded && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                {notification.message}
              </p>
            )}

            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              {getRelativeTime(notification.created_at)}
            </p>

            {isPendingRequest && !isExpanded && (
              <p className="text-xs text-primary-600 dark:text-primary-400 mt-2 font-medium">
                Click to respond →
              </p>
            )}
          </div>
        </div>
      </button>

      {/* Expanded Request Details for Pending Borrow Requests */}
      {isExpanded && isPendingRequest && notification.related_request && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-200 dark:border-gray-700 pt-3">
          {/* Item Details */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
              {notification.related_request.item?.name || notification.related_item?.name}
            </h4>
            {notification.related_request.item?.description && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {notification.related_request.item.description}
              </p>
            )}
            {notification.related_request.item?.category && (
              <span className="inline-block mt-2 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                {notification.related_request.item.category}
              </span>
            )}
          </div>

          {/* Request Details */}
          {notification.related_request.requested_due_date && (
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <span>Requested return: {formatDate(notification.related_request.requested_due_date)}</span>
            </div>
          )}

          {notification.related_request.message && (
            <div className="bg-gray-50 dark:bg-gray-900 rounded p-2">
              <p className="text-xs text-gray-700 dark:text-gray-300">
                &quot;{notification.related_request.message}&quot;
              </p>
            </div>
          )}

          {/* Feedback */}
          {feedback && (
            <div
              className={`p-2 rounded-lg text-xs ${
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
            <div className="flex gap-2">
              <button
                onClick={handleAccept}
                disabled={isAccepting || isRejecting}
                className={`flex-1 px-3 py-2 rounded-lg font-medium text-white text-sm transition-colors ${
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
                className={`flex-1 px-3 py-2 rounded-lg font-medium text-white text-sm transition-colors ${
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
      )}
    </div>
  )
}
