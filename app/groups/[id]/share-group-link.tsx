'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'

interface ShareGroupLinkProps {
    inviteCode: string
    groupId: string
}

export default function ShareGroupLink({ inviteCode, groupId }: ShareGroupLinkProps) {
    const [copied, setCopied] = useState(false)
    const inviteUrl = `${window.location.origin}/groups/join/${inviteCode}`

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(inviteUrl)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            // Clipboard copy failed - user can manually copy from the input
        }
    }

    return (
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg p-4">
            <h3 className="font-semibold mb-2">Invite Link</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-3">
                Share this link with others to invite them to join this group
            </p>
            <div className="flex gap-2">
                <input
                    type="text"
                    value={inviteUrl}
                    readOnly
                    className="flex-1 px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--bg-base)] text-sm font-mono text-[var(--text-primary)]"
                />
                <Button onClick={handleCopy}>
                    {copied ? 'Copied!' : 'Copy Link'}
                </Button>
            </div>
        </div>
    )
}
