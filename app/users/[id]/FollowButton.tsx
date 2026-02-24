'use client'

// DEPRECATED: Follow feature removed (Decision #1)
// Use the new contact-based lending model instead
// See app/contacts/actions.ts for contact management

import { Button } from '@/components/ui'

export default function FollowButton() {
    return (
        <Button
            disabled
            variant="secondary"
        >
            Feature updated
        </Button>
    )
}
