'use client'

import { useState } from 'react'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'

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
            // Error handled by parent component
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalHeader>
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold">Add Items to Group</h2>
                    <button onClick={onClose} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
            </ModalHeader>

            <ModalBody>
                {items.length === 0 ? (
                    <p className="text-center text-[var(--text-tertiary)] py-8">You don't have any available items to add.</p>
                ) : (
                    <div className="space-y-2">
                        {items.map((item) => (
                            <div
                                key={item.id}
                                className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${selectedItems.has(item.id)
                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                        : 'border-[var(--border)] hover:bg-[var(--bg-surface)]'
                                    }`}
                                onClick={() => toggleItem(item.id)}
                            >
                                <div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 ${selectedItems.has(item.id)
                                        ? 'bg-primary-500 border-primary-500'
                                        : 'border-[var(--border)] bg-[var(--bg-base)]'
                                    }`}>
                                    {selectedItems.has(item.id) && (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-medium">{item.name}</h3>
                                    {item.description && <p className="text-sm text-[var(--text-tertiary)] truncate">{item.description}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </ModalBody>

            <ModalFooter>
                <div className="flex justify-end gap-3">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={selectedItems.size === 0 || isSubmitting}
                    >
                        {isSubmitting ? 'Adding...' : `Add ${selectedItems.size} Item${selectedItems.size !== 1 ? 's' : ''}`}
                    </Button>
                </div>
            </ModalFooter>
        </Modal>
    )
}
