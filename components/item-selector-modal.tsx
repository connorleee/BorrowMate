'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'

interface Item {
    id: string
    name: string
    description?: string
    status: string
}

interface ItemSelectorModalProps {
    isOpen: boolean
    onClose: () => void
    items: Item[]
    onAdd: (selectedItemIds: string[]) => Promise<void>
}

export default function ItemSelectorModal({ isOpen, onClose, items, onAdd }: ItemSelectorModalProps) {
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
    const [isSubmitting, setIsSubmitting] = useState(false)

    if (!isOpen) return null

    const toggleItem = (itemId: string) => {
        const newSelected = new Set(selectedItems)
        if (newSelected.has(itemId)) {
            newSelected.delete(itemId)
        } else {
            newSelected.add(itemId)
        }
        setSelectedItems(newSelected)
    }

    const handleSubmit = async () => {
        if (selectedItems.size === 0) return
        setIsSubmitting(true)
        try {
            await onAdd(Array.from(selectedItems))
            onClose()
            setSelectedItems(new Set())
        } catch (error) {
            console.error('Failed to add items:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold">Add Items to Group</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    {items.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">You don't have any available items to add.</p>
                    ) : (
                        <div className="space-y-2">
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${selectedItems.has(item.id)
                                            ? 'border-primary-500 bg-primary-50'
                                            : 'border-gray-200 hover:bg-gray-50'
                                        }`}
                                    onClick={() => toggleItem(item.id)}
                                >
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 ${selectedItems.has(item.id)
                                            ? 'bg-primary-500 border-primary-500'
                                            : 'border-gray-300 bg-white'
                                        }`}>
                                        {selectedItems.has(item.id) && (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-medium">{item.name}</h3>
                                        {item.description && <p className="text-sm text-gray-500 truncate">{item.description}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={selectedItems.size === 0 || isSubmitting}
                        className={`px-4 py-2 rounded-lg font-medium text-white transition-colors ${selectedItems.size === 0 || isSubmitting
                                ? 'bg-primary-300 cursor-not-allowed'
                                : 'bg-primary-500 hover:bg-primary-600'
                            }`}
                    >
                        {isSubmitting ? 'Adding...' : `Add ${selectedItems.size} Item${selectedItems.size !== 1 ? 's' : ''}`}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    )
}
