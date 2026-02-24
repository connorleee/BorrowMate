'use client'

import { useState } from 'react'
import { createGroup } from './actions'
import { Button, Input } from '@/components/ui'
import { useToast } from '@/components/toast-provider'

export default function CreateGroupForm() {
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const { addToast } = useToast()

    if (!isOpen) {
        return (
            <Button onClick={() => setIsOpen(true)}>
                Create New Group
            </Button>
        )
    }

    return (
        <div className="bg-[var(--bg-surface)] p-4 rounded-lg border border-[var(--border)] w-full max-w-md">
            <h3 className="font-bold mb-4">Create a New Group</h3>
            {error && (
                <div className="bg-error-50 text-error-600 p-3 rounded-lg mb-4 text-sm">
                    {error}
                </div>
            )}
            <form
                action={async (formData) => {
                    setLoading(true)
                    setError(null)
                    const name = formData.get('name') as string
                    const description = formData.get('description') as string
                    const result = await createGroup({ name, description })
                    if (result?.serverError) {
                        addToast('error', result.serverError)
                    } else {
                        addToast('success', 'Group created')
                    }
                    setLoading(false)
                }}
                className="flex flex-col gap-4"
            >
                <Input
                    name="name"
                    placeholder="Group Name (e.g. Apartment 4B)"
                    required
                    inputSize="lg"
                />
                <textarea
                    name="description"
                    placeholder="Description (optional)"
                    className="p-3 border border-[var(--border)] rounded-lg bg-[var(--bg-base)] text-[var(--text-primary)]"
                />
                <div className="flex gap-2 justify-end">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setIsOpen(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? 'Creating...' : 'Create Group'}
                    </Button>
                </div>
            </form>
        </div>
    )
}
