'use client'

import { useState } from 'react'
import { createGroup } from './actions'

export default function CreateGroupForm() {
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="bg-foreground text-background px-4 py-2 rounded-lg font-medium"
            >
                Create New Group
            </button>
        )
    }

    return (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 w-full max-w-md">
            <h3 className="font-bold mb-4">Create a New Group</h3>
            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
                    {error}
                </div>
            )}
            <form
                action={async (formData) => {
                    setLoading(true)
                    setError(null)
                    const result = await createGroup(formData)
                    if (result?.error) {
                        setError(result.error)
                    }
                    setLoading(false)
                }}
                className="flex flex-col gap-4"
            >
                <input
                    name="name"
                    placeholder="Group Name (e.g. Apartment 4B)"
                    required
                    className="p-2 border rounded"
                />
                <textarea
                    name="description"
                    placeholder="Description (optional)"
                    className="p-2 border rounded"
                />
                <div className="flex gap-2 justify-end">
                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="px-4 py-2 text-gray-600"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-foreground text-background px-4 py-2 rounded font-medium disabled:opacity-50"
                    >
                        {loading ? 'Creating...' : 'Create Group'}
                    </button>
                </div>
            </form>
        </div>
    )
}
