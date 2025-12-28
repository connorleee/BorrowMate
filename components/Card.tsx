'use client'

import { ReactNode } from 'react'
import Link from 'next/link'

// ============= BASE CARD COMPONENT =============

interface BaseCardProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'compact'
  interactive?: boolean
  onClick?: () => void
}

export function Card({
  children,
  className = '',
  variant = 'default',
  interactive = false,
  onClick
}: BaseCardProps) {
  const baseStyles = 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg transition-all'
  const padding = variant === 'compact' ? 'p-3' : 'p-4'
  const interactiveStyles = interactive
    ? 'cursor-pointer hover:border-primary-300 hover:shadow-md'
    : ''

  return (
    <div
      className={`${baseStyles} ${padding} ${interactiveStyles} ${className}`}
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
    >
      {children}
    </div>
  )
}

// ============= ITEM CARD VARIANT =============

interface ItemCardProps {
  name: string
  description?: string | null
  status?: string
  groupName?: string | null
  isMultiSelectMode?: boolean
  isSelected?: boolean
  onToggleSelect?: (itemId: string) => void
  onViewDetails?: (itemId: string) => void
  itemId?: string
  deleteButton?: ReactNode
  className?: string
}

export function ItemCard({
  name,
  description,
  status,
  groupName,
  isMultiSelectMode = false,
  isSelected = false,
  onToggleSelect,
  onViewDetails,
  itemId = '',
  deleteButton,
  variant = 'default',
  className = ''
}: ItemCardProps & { variant?: 'default' | 'compact' }) {
  const handleClick = () => {
    if (isMultiSelectMode && onToggleSelect) {
      onToggleSelect(itemId)
    } else if (!isMultiSelectMode && onViewDetails) {
      onViewDetails(itemId)
    }
  }

  const padding = variant === 'compact' ? 'p-3' : 'p-4'
  const titleSize = variant === 'compact' ? 'text-sm' : 'text-base'

  const cardStyles = isMultiSelectMode
    ? isSelected
      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-500 cursor-pointer'
      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer'
    : 'border-gray-200 dark:border-gray-700 cursor-pointer hover:border-primary-300 dark:hover:border-primary-500 hover:shadow-md'

  return (
    <div
      className={`bg-white dark:bg-gray-800 ${padding} rounded-lg transition-colors border ${cardStyles} ${className}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-3 flex-1">
          {isMultiSelectMode && (
            <div
              className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 ${isSelected
                ? 'bg-primary-500 border-primary-500'
                : 'border-gray-300 bg-white'
                }`}
            >
              {isSelected && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              )}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold ${titleSize} leading-snug text-gray-900 dark:text-gray-100 mb-1 truncate`}>
              {name}
            </h3>
            {description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                {description}
              </p>
            )}
            {(status || groupName) && (
              <div className="flex flex-wrap gap-1.5">
                {groupName ? (
                  <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded text-xs font-medium">
                    {groupName}
                  </span>
                ) : (
                  <span className="bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2.5 py-1 rounded border border-yellow-200 dark:border-yellow-800 text-xs font-medium">
                    Unassigned
                  </span>
                )}
                {status === 'unavailable' && (
                  <span className="px-2.5 py-1 rounded bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 text-xs font-medium">
                    Unavailable
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        {!isMultiSelectMode && deleteButton && <div className="ml-2 flex-shrink-0">{deleteButton}</div>}
      </div>
    </div>
  )
}

// ============= CONTACT CARD VARIANT =============

interface ContactCardProps {
  id?: string
  name: string
  email?: string | null
  phone?: string | null
  linkedUser?: boolean
  actions?: ReactNode
  className?: string
}

export function ContactCard({
  id,
  name,
  email,
  phone,
  linkedUser = false,
  actions,
  className = ''
}: ContactCardProps) {
  return (
    <Card variant="default" className={className}>
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100 truncate">
              {id ? (
                <Link href={`/contacts/${id}`} className="hover:text-primary-600 hover:underline">
                  {name}
                </Link>
              ) : (
                name
              )}
            </h3>
            {linkedUser && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 flex-shrink-0">
                Linked
              </span>
            )}
          </div>
          <div className="space-y-1 text-xs">
            {email && (
              <p className="text-gray-600 dark:text-gray-400 truncate">
                <span className="text-gray-400 dark:text-gray-500">Email:</span> {email}
              </p>
            )}
            {phone && (
              <p className="text-gray-600 dark:text-gray-400 truncate">
                <span className="text-gray-400 dark:text-gray-500">Phone:</span> {phone}
              </p>
            )}
            {!email && !phone && (
              <p className="text-gray-400 dark:text-gray-500 italic">No info</p>
            )}
          </div>
        </div>
        {actions && <div className="ml-3 flex-shrink-0">{actions}</div>}
      </div>
    </Card>
  )
}

// ============= GROUP CARD VARIANT =============

interface GroupCardProps {
  name: string
  description?: string | null
  role?: string
  createdAt?: string
  className?: string
  onClick?: () => void
}

export function GroupCard({
  name,
  description,
  role,
  createdAt,
  className = '',
  onClick
}: GroupCardProps) {
  return (
    <Card
      variant="compact"
      interactive={!!onClick}
      onClick={onClick}
      className={className}
    >
      <h2 className="font-semibold text-base text-gray-900 dark:text-gray-100 mb-2">{name}</h2>
      {description && (
        <p className="text-gray-600 dark:text-gray-400 text-xs mb-3 line-clamp-2">{description}</p>
      )}
      {(role || createdAt) && (
        <div className="flex justify-between items-center text-xs text-gray-400 dark:text-gray-500">
          {role && <span>{role === 'owner' ? 'Owner' : 'Member'}</span>}
          {createdAt && <span>{new Date(createdAt).toLocaleDateString()}</span>}
        </div>
      )}
    </Card>
  )
}

// ============= BORROW RECORD CARD VARIANT =============

interface BorrowRecordCardProps {
  itemName: string
  contactName: string
  dueDate?: string | null
  status?: string
  returnedDate?: string | null
  actions?: ReactNode
  className?: string
}

export function BorrowRecordCard({
  itemName,
  contactName,
  dueDate,
  status = 'borrowed',
  returnedDate,
  actions,
  className = ''
}: BorrowRecordCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'returned':
        return 'bg-green-100 text-green-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      case 'lost':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  return (
    <Card variant="default" className={className}>
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100 mb-1 truncate">
            {itemName}
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 truncate">
            <span className="text-gray-400 dark:text-gray-500">From:</span> {contactName}
          </p>
          <div className="flex flex-wrap gap-1.5">
            <span className={`px-2.5 py-1 rounded text-xs font-medium ${getStatusColor(status)}`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
            {dueDate && (
              <span className="px-2.5 py-1 rounded border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400">
                Due: {new Date(dueDate).toLocaleDateString()}
              </span>
            )}
            {returnedDate && (
              <span className="px-2.5 py-1 rounded border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400">
                Returned: {new Date(returnedDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        {actions && <div className="ml-3 flex-shrink-0">{actions}</div>}
      </div>
    </Card>
  )
}
