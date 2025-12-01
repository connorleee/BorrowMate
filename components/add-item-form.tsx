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
            const result = await createItem(formData)
            setIsSubmitting(false)

            if (result?.error) {
                setMessage({ type: 'error', text: result.error })
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
            console.error('Form submission error:', error)
        }
    }

    return (
        <form action={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">Add New Item</h2>

            {message && (
                <div className={`p-3 rounded-md text-sm ${message.type === 'success'
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                    {message.text}
                </div>
            )}

            {/* Group selection removed as items are added before group assignment */}

            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    placeholder="e.g., Cordless Drill"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
            </div>

            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <textarea
                    name="description"
                    id="description"
                    rows={3}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
            </div>

            <div>
                <label htmlFor="privacy" className="block text-sm font-medium text-gray-700 mb-1">Privacy</label>
                <select
                    name="privacy"
                    id="privacy"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    defaultValue="private"
                >
                    <option value="private">Private (Only visible to me)</option>
                    <option value="public">Public (Visible to borrowers and group members)</option>
                </select>
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary-500 text-white py-2 px-4 rounded-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isSubmitting ? 'Adding...' : 'Add Item'}
            </button>
        </form>
    )
}
