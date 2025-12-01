'use client'

import { createItem } from '@/app/items/actions'
import { useRouter } from 'next/navigation'
import { useState, use } from 'react'

export default function AddItemPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: groupId } = use(params)
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        // Append groupId to formData
        formData.append('groupId', groupId)

        const result = await createItem(formData)

        if (result?.error) {
            alert(result.error)
            setLoading(false)
        } else {
            router.push(`/groups/${groupId}`)
            router.refresh()
        }
    }

    return (
        <div className="w-full max-w-md mx-auto">
            <h1 className="text-2xl font-bold mb-6">Add New Item</h1>
            <form action={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Item Name</label>
                    <input
                        name="name"
                        required
                        placeholder="e.g. Cordless Drill"
                        className="p-2 border rounded"
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Category</label>
                    <input
                        name="category"
                        placeholder="e.g. Tools"
                        className="p-2 border rounded"
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Description</label>
                    <textarea
                        name="description"
                        placeholder="Optional details..."
                        className="p-2 border rounded"
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Privacy</label>
                    <select name="privacy" className="p-2 border rounded">
                        <option value="public">Public (Visible to group members)</option>
                        <option value="private">Private (Only visible to me)</option>
                    </select>
                </div>

                <div className="flex gap-4 mt-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="flex-1 p-2 border rounded text-gray-600"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-foreground text-background p-2 rounded font-medium disabled:opacity-50"
                    >
                        {loading ? 'Adding...' : 'Add Item'}
                    </button>
                </div>
            </form>
        </div>
    )
}
