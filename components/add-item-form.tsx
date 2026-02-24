'use client'

import { createItem } from '@/app/items/actions'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function AddItemForm() {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const handleSubmit = async (formData: FormData) => {
        setIsSubmitting(true)
        setMessage(null)

        try {
            const name = formData.get('name') as string
            const description = formData.get('description') as string || ''
            const category = formData.get('category') as string || ''
            const privacy = (formData.get('privacy') as 'private' | 'public') || 'private'

            const result = await createItem({ name, description, category, privacy })
            setIsSubmitting(false)

            if (result?.serverError) {
                setMessage({ type: 'error', text: result.serverError })
            } else {
                setMessage({ type: 'success', text: 'Item added successfully!' })
                const form = document.querySelector('form') as HTMLFormElement
                form.reset()
                // Clear success message after 3 seconds
                setTimeout(() => setMessage(null), 3000)
            }
        } catch (error) {
            setIsSubmitting(false)
            setMessage({ type: 'error', text: 'An unexpected error occurred' })
        }
    }

    return (
        <form action={handleSubmit} className="bg-[var(--bg-surface)] p-4 rounded-lg border border-[var(--border)] transition-all">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Add New Item</h2>

            {message && (
                <div className={`p-3 rounded-md text-sm mb-4 ${message.type === 'success'
                        ? 'bg-success-100 text-success-800 border border-success-200 dark:bg-success-900 dark:text-success-200 dark:border-success-800'
                        : 'bg-error-100 text-error-800 border border-error-200 dark:bg-error-900 dark:text-error-200 dark:border-error-800'
                    }`}>
                    {message.text}
                </div>
            )}

            <div className="space-y-4">
                <Input
                    label="Item Name"
                    type="text"
                    name="name"
                    id="name"
                    required
                    placeholder="e.g., Cordless Drill"
                    inputSize="md"
                />

                <div>
                    <label htmlFor="description" className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Description (Optional)</label>
                    <textarea
                        name="description"
                        id="description"
                        rows={2}
                        placeholder="Brief description..."
                        className="w-full rounded-md border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    />
                </div>

                <div>
                    <label htmlFor="privacy" className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Privacy</label>
                    <select
                        name="privacy"
                        id="privacy"
                        className="w-full rounded-md border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        defaultValue="private"
                    >
                        <option value="private">Private</option>
                        <option value="public">Public</option>
                    </select>
                </div>

                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full"
                >
                    {isSubmitting ? 'Adding...' : 'Add Item'}
                </Button>
            </div>
        </form>
    )
}
