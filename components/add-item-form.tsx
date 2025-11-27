'use client'

import { createItem } from '@/app/items/actions'
import { useState } from 'react'

export default function AddItemForm() {
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (formData: FormData) => {
        setIsSubmitting(true)
        const result = await createItem(formData)
        setIsSubmitting(false)
        if (result?.error) {
            alert(result.error)
        } else {
            // Optional: reset form or show success message
            // For MVP, the page revalidation will update the list
            const form = document.querySelector('form') as HTMLFormElement
            form.reset()
        }
    }

    return (
        <form action={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-4">Add New Item</h2>

            {/* Group selection removed as items are added before group assignment */}

            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    placeholder="e.g., Cordless Drill"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <textarea
                    name="description"
                    id="description"
                    rows={3}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <div>
                <label htmlFor="visibility" className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
                <select
                    name="visibility"
                    id="visibility"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue="shared"
                >
                    <option value="shared">Shared (Visible to group)</option>
                    <option value="personal">Personal (Only visible to me)</option>
                </select>
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isSubmitting ? 'Adding...' : 'Add Item'}
            </button>
        </form>
    )
}
