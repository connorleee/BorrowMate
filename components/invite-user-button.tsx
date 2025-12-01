'use client'

import { useState } from 'react'
import InviteUserModal from './invite-user-modal'

export default function InviteUserButton({ groupId }: { groupId: string }) {
    const [isModalOpen, setIsModalOpen] = useState(false)

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="text-sm bg-primary-500 text-white px-3 py-1 rounded-md hover:bg-primary-600 transition-colors"
            >
                Invite Members
            </button>
            <InviteUserModal
                groupId={groupId}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    )
}
