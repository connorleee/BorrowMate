'use client'

import { useState } from 'react'
import Link from 'next/link'
import ItemSelectorModal from '@/components/item-selector-modal'
import { addItemsToGroup } from '@/app/groups/actions'
import { Button, buttonVariants } from '@/components/ui'

interface Item {
    id: string
    name: string
    description?: string
    status: string
    group_id?: string | null
}

interface GroupItemsManagerProps {
    groupId: string
    userItems: Item[]
}

export default function GroupItemsManager({ groupId, userItems }: GroupItemsManagerProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)

    // Filter items that are not already in this group
    const availableItems = userItems.filter(item => item.group_id !== groupId)

    const handleAddItems = async (selectedItemIds: string[]) => {
        const result = await addItemsToGroup({ groupId, itemIds: selectedItemIds })
        if (result?.serverError) {
            alert(result.serverError)
        }
    }

    return (
        <>
            <div className="flex gap-2">
                <Button
                    onClick={() => setIsModalOpen(true)}
                >
                    Add Existing Item
                </Button>
                <Link
                    href={`/groups/${groupId}/items/new`}
                    className={buttonVariants({ variant: 'secondary' })}
                >
                    Create New Item
                </Link>
            </div>

            <ItemSelectorModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                items={availableItems}
                onAdd={handleAddItems}
            />
        </>
    )
}
