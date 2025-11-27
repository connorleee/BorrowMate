'use client'

import { useState } from 'react'

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
            console.error('Failed to copy:', err)
        }
    }

    return (
        <div className="bg-gray-50 border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Invite Link</h3>
            <p className="text-sm text-gray-600 mb-3">
                Share this link with others to invite them to join this group
            </p>
            <div className="flex gap-2">
                <input
                    type="text"
                    value={inviteUrl}
                    readOnly
                    className="flex-1 px-3 py-2 border rounded-lg bg-white text-sm font-mono"
                />
                <button
                    onClick={handleCopy}
                    className="px-4 py-2 bg-foreground text-background rounded-lg font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
                >
                    {copied ? '✓ Copied!' : 'Copy Link'}
                </button>
            </div>
        </div>
    )
}
