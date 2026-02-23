'use client'

import { createItem } from '@/app/items/actions'
import { useState } from 'react'

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
        <form action={handleSubmit} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 transition-all">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Add New Item</h2>

            {message && (
                <div className={`p-3 rounded-md text-sm mb-4 ${message.type === 'success'
                        ? 'bg-green-50 text-green-800 border border-green-200 dark:bg-green-900/30 dark:text-green-200 dark:border-green-800'
                        : 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800'
                    }`}>
                    {message.text}
                </div>
            )}

            <div className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Item Name</label>
                    <input
                        type="text"
                        name="name"
                        id="name"
                        required
                        placeholder="e.g., Cordless Drill"
                        className="w-full rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                </div>

                <div>
                    <label htmlFor="description" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Description (Optional)</label>
                    <textarea
                        name="description"
                        id="description"
                        rows={2}
                        placeholder="Brief description..."
                        className="w-full rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    />
                </div>

                <div>
                    <label htmlFor="privacy" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Privacy</label>
                    <select
                        name="privacy"
                        id="privacy"
                        className="w-full rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        defaultValue="private"
                    >
                        <option value="private">Private</option>
                        <option value="public">Public</option>
                    </select>
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-primary-500 text-white py-2.5 px-4 rounded-md text-sm font-medium hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isSubmitting ? 'Adding...' : 'Add Item'}
                </button>
            </div>
        </form>
    )
}
