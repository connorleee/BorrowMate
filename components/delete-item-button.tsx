'use client'

import { useState } from 'react'
import { deleteItem } from '@/app/items/actions'

export default function DeleteItemButton({ itemId }: { itemId: string }) {
    const [isDeleting, setIsDeleting] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)

    const handleDelete = async () => {
        setIsDeleting(true)
        const result = await deleteItem(itemId)

        if (result?.error) {
            alert(result.error)
            setIsDeleting(false)
            setShowConfirm(false)
        }
        // If success, the page will revalidate and this component will unmount
    }

    return (
        <>
            <button
                onClick={() => setShowConfirm(true)}
                disabled={isDeleting}
                className="text-red-600 hover:text-red-800 text-sm font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
            >
                Delete
            </button>

            {showConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-gray-900">Delete Item</h3>
                            <p className="text-gray-500">
                                Are you sure you want to delete this item? This action cannot be undone.
                            </p>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowConfirm(false)}
                                disabled={isDeleting}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2"
                            >
                                {isDeleting ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    'Delete Item'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
