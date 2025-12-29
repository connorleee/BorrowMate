'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getUnreadNotificationCount } from '@/app/notifications/actions'
import NotificationPanel from './notification-panel'

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const bellButtonRef = useRef<HTMLButtonElement>(null)

  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await getUnreadNotificationCount()
      setUnreadCount(count)
    } catch (error) {
      console.error('Error fetching unread count:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchUnreadCount()
  }, [fetchUnreadCount])

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchUnreadCount()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [fetchUnreadCount])

  const handleBellClick = () => {
    setIsPanelOpen(!isPanelOpen)
  }

  const handlePanelClose = useCallback(() => {
    setIsPanelOpen(false)
    // Refresh count when panel closes
    fetchUnreadCount()
  }, [fetchUnreadCount])

  return (
    <div className="relative">
      <button
        ref={bellButtonRef}
        onClick={handleBellClick}
        className="relative p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
        aria-label="Notifications"
      >
        {/* Bell Icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>

        {/* Badge */}
        {!isLoading && unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isPanelOpen && (
        <NotificationPanel
          onClose={handlePanelClose}
          onCountChange={fetchUnreadCount}
          bellButtonRef={bellButtonRef}
        />
      )}
    </div>
  )
}
