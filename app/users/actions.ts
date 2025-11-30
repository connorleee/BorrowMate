'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// DEPRECATED: User follows feature removed (Decision #1)
// These functions are no longer supported. Use contacts instead (app/contacts/actions.ts)
// - followUser() → REMOVED
// - unfollowUser() → REMOVED
// - getFollowers() → REMOVED
// - getFollowing() → REMOVED
// - isFollowing() → REMOVED
// - getPublicItemsFromFollowing() → REMOVED

/**
 * Get user profile by ID
 */
export async function getUserProfile(userId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

    if (error) return null
    return data
}

/**
 * Get public items for a specific user
 */
export async function getUserPublicItems(userId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('items')
        .select(`
            *,
            groups (
                id,
                name
            )
        `)
        .eq('owner_user_id', userId)
        .eq('privacy', 'public')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching user public items:', error)
        return []
    }

    return data
}

// DEPRECATED: getFollowCounts() removed with user_follows feature
