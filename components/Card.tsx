'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { Card as UICard } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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
  return (
    <UICard
      variant={variant}
      interactive={interactive}
      onClick={onClick}
      className={className}
    >
      {children}
    </UICard>
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
      : 'border-[var(--border)] hover:bg-[var(--bg-surface)] cursor-pointer'
    : 'border-[var(--border)] cursor-pointer hover:border-primary-300 hover:shadow-md'

  return (
    <div
      className={`bg-[var(--bg-surface)] ${padding} rounded-lg transition-colors border ${cardStyles} ${className}`}
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
                : 'border-[var(--border)] bg-[var(--bg-base)]'
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
            <h3 className={`font-semibold ${titleSize} leading-snug text-[var(--text-primary)] mb-1 truncate`}>
              {name}
            </h3>
            {description && (
              <p className="text-xs text-[var(--text-tertiary)] mb-3 line-clamp-2">
                {description}
              </p>
            )}
            {(status || groupName) && (
              <div className="flex flex-wrap gap-1.5">
                {groupName ? (
                  <Badge variant="neutral">{groupName}</Badge>
                ) : (
                  <Badge variant="warning">Unassigned</Badge>
                )}
                {status === 'unavailable' && (
                  <Badge variant="error">Unavailable</Badge>
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
            <h3 className="font-semibold text-base text-[var(--text-primary)] truncate">
              {id ? (
                <Link href={`/contacts/${id}`} className="hover:text-primary-600 hover:underline">
                  {name}
                </Link>
              ) : (
                name
              )}
            </h3>
            {linkedUser && (
              <Badge variant="info" size="sm" className="flex-shrink-0">
                Linked
              </Badge>
            )}
          </div>
          <div className="space-y-1 text-xs">
            {email && (
              <p className="text-[var(--text-secondary)] truncate">
                <span className="text-[var(--text-tertiary)]">Email:</span> {email}
              </p>
            )}
            {phone && (
              <p className="text-[var(--text-secondary)] truncate">
                <span className="text-[var(--text-tertiary)]">Phone:</span> {phone}
              </p>
            )}
            {!email && !phone && (
              <p className="text-[var(--text-tertiary)] italic">No info</p>
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
      <h2 className="font-semibold text-base text-[var(--text-primary)] mb-2">{name}</h2>
      {description && (
        <p className="text-[var(--text-secondary)] text-xs mb-3 line-clamp-2">{description}</p>
      )}
      {(role || createdAt) && (
        <div className="flex justify-between items-center text-xs text-[var(--text-tertiary)]">
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
  const getStatusVariant = (status: string): 'success' | 'error' | 'info' => {
    switch (status) {
      case 'returned':
        return 'success'
      case 'overdue':
      case 'lost':
        return 'error'
      default:
        return 'info'
    }
  }

  return (
    <Card variant="default" className={className}>
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base text-[var(--text-primary)] mb-1 truncate">
            {itemName}
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mb-2 truncate">
            <span className="text-[var(--text-tertiary)]">From:</span> {contactName}
          </p>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant={getStatusVariant(status)} size="sm">
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
            {dueDate && (
              <span className="px-2.5 py-1 rounded border border-[var(--border)] text-xs font-medium text-[var(--text-secondary)]">
                Due: {new Date(dueDate).toLocaleDateString()}
              </span>
            )}
            {returnedDate && (
              <span className="px-2.5 py-1 rounded border border-[var(--border)] text-xs font-medium text-[var(--text-secondary)]">
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
