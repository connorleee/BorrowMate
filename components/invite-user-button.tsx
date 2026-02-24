'use client'

import { useState } from 'react'
import InviteUserModal from './invite-user-modal'
import { Button } from '@/components/ui'

export default function InviteUserButton({ groupId }: { groupId: string }) {
    const [isModalOpen, setIsModalOpen] = useState(false)

    return (
        <>
            <Button size="sm" onClick={() => setIsModalOpen(true)}>
                Invite Members
            </Button>
            <InviteUserModal
                groupId={groupId}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    )
}
