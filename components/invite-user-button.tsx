'use client'

import { useState } from 'react'
import InviteUserModal from './invite-user-modal'

export default function InviteUserButton({ groupId }: { groupId: string }) {
    const [isModalOpen, setIsModalOpen] = useState(false)

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="text-sm bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors"
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
