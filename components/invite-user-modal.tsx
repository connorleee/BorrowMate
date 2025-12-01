'use client'

import { useState, useEffect } from 'react'
import { searchUsers, addMembers } from '@/app/groups/actions'

interface User {
    id: string
    name: string
    email: string
}

interface InviteUserModalProps {
    groupId: string
    isOpen: boolean
    onClose: () => void
}

export default function InviteUserModal({ groupId, isOpen, onClose }: InviteUserModalProps) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<User[]>([])
    const [selectedUsers, setSelectedUsers] = useState<User[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (query.length >= 2) {
                setIsSearching(true)
                const users = await searchUsers(query)
                setResults(users)
                setIsSearching(false)
            } else {
                setResults([])
            }
        }, 300)

        return () => clearTimeout(delayDebounceFn)
    }, [query])

    const handleSelectUser = (user: User) => {
        if (selectedUsers.some(u => u.id === user.id)) {
            setSelectedUsers(selectedUsers.filter(u => u.id !== user.id))
        } else {
            setSelectedUsers([...selectedUsers, user])
        }
    }

    const handleSubmit = async () => {
        if (selectedUsers.length === 0) return

        setIsSubmitting(true)
        setError(null)

        const result = await addMembers(groupId, selectedUsers.map(u => u.id))

        if (result.error) {
            setError(result.error)
        } else {
            onClose()
            setQuery('')
            setSelectedUsers([])
            setResults([])
        }
        setIsSubmitting(false)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-md p-6 max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Invite Users</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        ✕
                    </button>
                </div>

                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        className="w-full p-2 border rounded-md"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>

                {error && (
                    <div className="bg-red-100 text-red-800 p-2 rounded-md mb-4 text-sm">
                        {error}
                    </div>
                )}

                <div className="flex-1 overflow-y-auto min-h-[200px] mb-4 border rounded-md p-2">
                    {isSearching ? (
                        <div className="text-center py-4 text-gray-500">Searching...</div>
                    ) : results.length > 0 ? (
                        <div className="space-y-2">
                            {results.map(user => (
                                <div
                                    key={user.id}
                                    className={`flex items-center p-2 rounded-md cursor-pointer hover:bg-gray-50 ${selectedUsers.some(u => u.id === user.id) ? 'bg-blue-50 border-blue-200 border' : ''
                                        }`}
                                    onClick={() => handleSelectUser(user)}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedUsers.some(u => u.id === user.id)}
                                        readOnly
                                        className="mr-3"
                                    />
                                    <div>
                                        <div className="font-medium">{user.name}</div>
                                        <div className="text-xs text-gray-500">{user.email}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : query.length >= 2 ? (
                        <div className="text-center py-4 text-gray-500">No users found</div>
                    ) : (
                        <div className="text-center py-4 text-gray-400">Type to search users</div>
                    )}
                </div>

                <div className="flex justify-between items-center border-t pt-4">
                    <div className="text-sm text-gray-500">
                        {selectedUsers.length} selected
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={selectedUsers.length === 0 || isSubmitting}
                            className={`px-4 py-2 bg-blue-600 text-white rounded-md ${selectedUsers.length === 0 || isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
                                }`}
                        >
                            {isSubmitting ? 'Adding...' : 'Add Members'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
