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
 * Returns full profile (with email) for own profile, limited profile (id + name only) for others
 */
export async function getUserProfile(userId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user && user.id === userId) {
        // Own profile: query users table directly (RLS allows own row)
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single()

        if (error) return null
        return data
    }

    // Other user: query user_profiles view (id + name only, no email/phone)
    const { data, error } = await supabase
        .from('user_profiles')
        .select('id, name')
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
        return []
    }

    return data
}

// DEPRECATED: getFollowCounts() removed with user_follows feature
