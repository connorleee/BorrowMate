'use client'

import { useState } from 'react'
import Link from 'next/link'
import ItemSelectorModal from '@/components/item-selector-modal'
import { addItemsToGroup } from '@/app/groups/actions'

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
    // Note: userItems contains all items owned by the user. 
    // We want to show items that are either personal (group_id is null) 
    // or maybe in another group (if we want to move them? For now let's assume we only add personal items or move items)
    // The prompt says "displays all of a user's items". 
    // Let's filter out items that are ALREADY in this group.
    const availableItems = userItems.filter(item => item.group_id !== groupId)

    const handleAddItems = async (selectedItemIds: string[]) => {
        const result = await addItemsToGroup(groupId, selectedItemIds)
        if (result.error) {
            alert(result.error)
        }
    }

    return (
        <>
            <div className="flex gap-2">
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-foreground text-background px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
                >
                    Add Existing Item
                </button>
                <Link
                    href={`/groups/${groupId}/items/new`}
                    className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
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
