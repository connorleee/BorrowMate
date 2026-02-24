'use client'

import { createItem } from '@/app/items/actions'
import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/toast-provider'

export default function AddItemForm() {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { addToast } = useToast()
    const formRef = useRef<HTMLFormElement>(null)

    const handleSubmit = async (formData: FormData) => {
        setIsSubmitting(true)

        try {
            const name = formData.get('name') as string
            const description = formData.get('description') as string || ''
            const category = formData.get('category') as string || ''
            const privacy = (formData.get('privacy') as 'private' | 'public') || 'private'

            const result = await createItem({ name, description, category, privacy })
            setIsSubmitting(false)

            if (result?.serverError) {
                addToast('error', result.serverError)
            } else {
                addToast('success', 'Item added successfully')
                formRef.current?.reset()
            }
        } catch (error) {
            setIsSubmitting(false)
            addToast('error', 'An unexpected error occurred')
        }
    }

    return (
        <form ref={formRef} action={handleSubmit} className="bg-[var(--bg-surface)] p-4 rounded-lg border border-[var(--border)] transition-all">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Add New Item</h2>

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
