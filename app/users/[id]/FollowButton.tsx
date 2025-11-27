'use client'

import { followUser, unfollowUser } from '@/app/users/actions'
import { useState, useTransition } from 'react'

export default function FollowButton({
    userId,
    initialFollowing
}: {
    userId: string
    initialFollowing: boolean
}) {
    const [isFollowing, setIsFollowing] = useState(initialFollowing)
    const [isPending, startTransition] = useTransition()

    const handleFollow = () => {
        startTransition(async () => {
            if (isFollowing) {
                const result = await unfollowUser(userId)
                if (result.success) {
                    setIsFollowing(false)
                }
            } else {
                const result = await followUser(userId)
                if (result.success) {
                    setIsFollowing(true)
                }
            }
        })
    }

    return (
        <button
            onClick={handleFollow}
            disabled={isPending}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${isFollowing
                    ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
            {isPending ? 'Loading...' : isFollowing ? 'Following' : 'Follow'}
        </button>
    )
}
