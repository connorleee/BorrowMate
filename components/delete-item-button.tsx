'use client'

import { useState } from 'react'
import { deleteItem } from '@/app/items/actions'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'

export default function DeleteItemButton({ itemId }: { itemId: string }) {
    const [isDeleting, setIsDeleting] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)

    const handleDelete = async () => {
        setIsDeleting(true)
        const result = await deleteItem({ itemId })

        if (result?.serverError) {
            alert(result.serverError)
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
                className="text-error-600 hover:text-error-800 text-sm font-medium px-2 py-1 rounded hover:bg-error-50 transition-colors disabled:opacity-50"
            >
                Delete
            </button>

            <Modal isOpen={showConfirm} onClose={() => setShowConfirm(false)} size="sm">
                <ModalBody className="p-6 space-y-4">
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Delete Item</h3>
                        <p className="text-[var(--text-secondary)]">
                            Are you sure you want to delete this item? This action cannot be undone.
                        </p>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <div className="flex justify-end gap-3">
                        <Button
                            variant="secondary"
                            onClick={() => setShowConfirm(false)}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                'Delete Item'
                            )}
                        </Button>
                    </div>
                </ModalFooter>
            </Modal>
        </>
    )
}
