'use client'

// DEPRECATED: Follow feature removed (Decision #1)
// Use the new contact-based lending model instead
// See app/contacts/actions.ts for contact management

export default function FollowButton() {
    return (
        <button
            disabled
            className="px-6 py-2 rounded-lg font-medium text-gray-500 bg-gray-100 cursor-not-allowed"
        >
            Feature updated
        </button>
    )
}
