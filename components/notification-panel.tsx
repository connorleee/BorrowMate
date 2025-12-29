'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { getNotifications, markAllNotificationsAsRead } from '@/app/notifications/actions'
import NotificationItem from './notification-item'

interface NotificationPanelProps {
  onClose: () => void
  onCountChange: () => void
  bellButtonRef: React.RefObject<HTMLButtonElement | null>
}

export default function NotificationPanel({ onClose, onCountChange, bellButtonRef }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const panelRef = useRef<HTMLDivElement>(null)

  // Calculate position based on bell button
  useEffect(() => {
    if (bellButtonRef.current) {
      const rect = bellButtonRef.current.getBoundingClientRect()
      setPosition({
        top: rect.bottom + 8, // 8px gap below button
        left: Math.max(8, rect.left - 384 + rect.width), // 384px is panel width, align right edge, but keep 8px margin
      })
    }
  }, [bellButtonRef])

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await getNotifications(20) // Fetch 20 most recent
        setNotifications(data)
      } catch (error) {
        console.error('Error fetching notifications:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchNotifications()
  }, [])

  // Close panel when clicking outside (simplified since we're using portal)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node

      // Check if click is outside both the panel and the bell button
      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        bellButtonRef.current &&
        !bellButtonRef.current.contains(target)
      ) {
        onClose()
      }
    }

    // Small delay to prevent immediate closure
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 100)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClose, bellButtonRef])

  const handleMarkAllAsRead = async () => {
    setIsMarkingAllRead(true)
    try {
      await markAllNotificationsAsRead()
      // Update local state
      setNotifications(notifications.map(n => ({ ...n, status: 'read' })))
      onCountChange()
    } catch (error) {
      console.error('Error marking all as read:', error)
    } finally {
      setIsMarkingAllRead(false)
    }
  }

  const handleNotificationRead = (notificationId: string) => {
    // Update local state
    setNotifications(notifications.map(n =>
      n.id === notificationId ? { ...n, status: 'read' } : n
    ))
    onCountChange()
  }

  const unreadCount = notifications.filter(n => n.status === 'unread').length

  // Don't render on server
  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      ref={panelRef}
      className="fixed w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-[600px] flex flex-col"
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          Notifications
        </h2>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={isMarkingAllRead}
            className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium disabled:opacity-50"
          >
            {isMarkingAllRead ? 'Marking...' : 'Mark all as read'}
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="overflow-y-auto flex-1">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mx-auto mb-3 opacity-50"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            <p>No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onRead={handleNotificationRead}
                onClose={onClose}
              />
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
