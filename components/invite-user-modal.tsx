'use client'

import { useState, useEffect } from 'react'
import { searchUsers, addMembers } from '@/app/groups/actions'
import { Modal, ModalHeader, ModalBody, ModalFooter, Input, Button } from '@/components/ui'

interface User {
    id: string
    name: string
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

        const result = await addMembers({ groupId, userIds: selectedUsers.map(u => u.id) })

        if (result?.serverError) {
            setError(result.serverError)
        } else {
            onClose()
            setQuery('')
            setSelectedUsers([])
            setResults([])
        }
        setIsSubmitting(false)
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="sm">
            <ModalHeader className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-[var(--text-primary)]">Invite Users</h2>
                <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                    ✕
                </button>
            </ModalHeader>

            <ModalBody className="space-y-4">
                <Input
                    type="text"
                    placeholder="Search by name..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />

                {error && (
                    <div className="bg-error-100 text-error-800 p-2 rounded-md text-sm">
                        {error}
                    </div>
                )}

                <div className="overflow-y-auto min-h-[200px] border border-[var(--border)] rounded-md p-2">
                    {isSearching ? (
                        <div className="text-center py-4 text-[var(--text-secondary)]">Searching...</div>
                    ) : results.length > 0 ? (
                        <div className="space-y-2">
                            {results.map(user => (
                                <div
                                    key={user.id}
                                    className={`flex items-center p-2 rounded-md cursor-pointer hover:bg-[var(--bg-surface)] ${selectedUsers.some(u => u.id === user.id) ? 'bg-primary-50 border-primary-200 border' : ''
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
                                        <div className="font-medium text-[var(--text-primary)]">{user.name}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : query.length >= 2 ? (
                        <div className="text-center py-4 text-[var(--text-secondary)]">No users found</div>
                    ) : (
                        <div className="text-center py-4 text-[var(--text-tertiary)]">Type to search users</div>
                    )}
                </div>
            </ModalBody>

            <ModalFooter className="flex justify-between items-center">
                <div className="text-sm text-[var(--text-secondary)]">
                    {selectedUsers.length} selected
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={selectedUsers.length === 0 || isSubmitting}
                    >
                        {isSubmitting ? 'Adding...' : 'Add Members'}
                    </Button>
                </div>
            </ModalFooter>
        </Modal>
    )
}
