'use client'

import { borrowItem } from '@/app/borrow/actions'
import { getItemDetails } from '@/app/items/actions'
import { useRouter } from 'next/navigation'
import { useState, useEffect, use } from 'react'

export default function BorrowItemPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: itemId } = use(params)
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [item, setItem] = useState<any>(null)

    useEffect(() => {
        getItemDetails(itemId).then(setItem)
    }, [itemId])

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        formData.append('itemId', itemId)
        formData.append('groupId', item.group_id)

        const result = await borrowItem(formData)

        if (result?.error) {
            alert(result.error)
            setLoading(false)
        }
        // Redirect handled in action
    }

    if (!item) return <div>Loading...</div>

    return (
        <div className="w-full max-w-md mx-auto">
            <h1 className="text-2xl font-bold mb-6">Borrow {item.name}</h1>
            <form action={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Borrower Name</label>
                    <input
                        name="borrowerName"
                        placeholder="Me (or enter name if external)"
                        className="p-3 border border-border rounded bg-base"
                    />
                    <p className="text-xs text-text-tertiary">Leave blank if you are borrowing it yourself.</p>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Start Date</label>
                    <input
                        name="startDate"
                        type="date"
                        required
                        defaultValue={new Date().toISOString().split('T')[0]}
                        className="p-3 border border-border rounded bg-base"
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium">Due Date (Optional)</label>
                    <input
                        name="dueDate"
                        type="date"
                        className="p-3 border border-border rounded bg-base"
                    />
                </div>

                <div className="flex gap-4 mt-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="flex-1 p-3 border border-border rounded text-text-secondary hover:bg-surface"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-foreground text-background p-3 rounded font-medium disabled:opacity-50"
                    >
                        {loading ? 'Confirm Borrow' : 'Confirm'}
                    </button>
                </div>
            </form>
        </div>
    )
}
