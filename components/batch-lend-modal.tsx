'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { getPotentialBorrowers, searchPotentialBorrowers } from '@/app/items/actions'

interface User {
  id: string
  name: string
  email: string
  source?: string
}

interface BatchLendModalProps {
  isOpen: boolean
  onClose: () => void
  selectedItemIds: string[]
  onLend: (borrowerId: string) => Promise<void>
}

export default function BatchLendModal({
  isOpen,
  onClose,
  selectedItemIds,
  onLend
}: BatchLendModalProps) {
  const [selectedBorrower, setSelectedBorrower] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [following, setFollowing] = useState<User[]>([])
  const [groupMembers, setGroupMembers] = useState<User[]>([])
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load initial data when modal opens
  useEffect(() => {
    if (isOpen) {
      loadPotentialBorrowers()
    } else {
      // Reset state when modal closes
      setSelectedBorrower(null)
      setSearchQuery('')
      setSearchResults([])
      setError(null)
    }
  }, [isOpen])

  // Debounced search
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const delayDebounceFn = setTimeout(async () => {
      const results = await searchPotentialBorrowers(searchQuery)
      setSearchResults(results)
      setIsSearching(false)
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery])

  const loadPotentialBorrowers = async () => {
    setIsLoading(true)
    try {
      const { following: followingData, groupMembers: groupMembersData } =
        await getPotentialBorrowers()
      setFollowing(followingData)
      setGroupMembers(groupMembersData)
    } catch (err) {
      setError('Failed to load potential borrowers')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!selectedBorrower) return

    setIsSubmitting(true)
    setError(null)

    try {
      await onLend(selectedBorrower)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to lend items')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  // Determine which list to display
  const showSearchResults = searchQuery.length >= 2
  const displayFollowing = showSearchResults
    ? searchResults.filter((u) => u.source === 'following' || u.source === 'both')
    : following
  const displayGroupMembers = showSearchResults
    ? searchResults.filter((u) => u.source === 'group' || u.source === 'both')
    : groupMembers

  const hasNoRecipients = following.length === 0 && groupMembers.length === 0

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">
            Lend {selectedItemIds.length} Item{selectedItemIds.length !== 1 ? 's' : ''}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isSubmitting}
          >
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
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b">
          <input
            type="text"
            placeholder="Search by name or email..."
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-4 mt-4 bg-red-100 text-red-800 p-2 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : hasNoRecipients ? (
            <div className="text-center py-8 text-gray-500">
              <p>You don't have any followers or group members to lend to.</p>
              <p className="text-sm mt-2">
                Follow users or join groups to lend items.
              </p>
            </div>
          ) : isSearching ? (
            <div className="text-center py-4 text-gray-500">Searching...</div>
          ) : showSearchResults && searchResults.length === 0 ? (
            <div className="text-center py-4 text-gray-500">No users found</div>
          ) : (
            <div className="space-y-6">
              {/* People You Follow */}
              {displayFollowing.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    People You Follow
                  </h3>
                  <div className="space-y-2">
                    {displayFollowing.map((user) => (
                      <div
                        key={user.id}
                        className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedBorrower === user.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedBorrower(user.id)}
                      >
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${
                            selectedBorrower === user.id
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-300 bg-white'
                          }`}
                        >
                          {selectedBorrower === user.id && (
                            <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Group Members */}
              {displayGroupMembers.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    Group Members
                  </h3>
                  <div className="space-y-2">
                    {displayGroupMembers.map((user) => (
                      <div
                        key={user.id}
                        className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedBorrower === user.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedBorrower(user.id)}
                      >
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 ${
                            selectedBorrower === user.id
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-300 bg-white'
                          }`}
                        >
                          {selectedBorrower === user.id && (
                            <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!showSearchResults && (
                <div className="text-center text-sm text-gray-400 pt-2">
                  Type to search for specific users
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedBorrower || isSubmitting}
            className={`px-4 py-2 rounded-lg font-medium text-white transition-colors ${
              !selectedBorrower || isSubmitting
                ? 'bg-blue-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isSubmitting ? 'Lending...' : 'Lend Items'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
