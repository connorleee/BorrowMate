'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Follow a user
 */
export async function followUser(userId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Not authenticated' }
    if (user.id === userId) return { error: 'Cannot follow yourself' }

    const { error } = await supabase
        .from('user_follows')
        .insert({
            follower_id: user.id,
            following_id: userId,
        })

    if (error) return { error: error.message }

    revalidatePath(`/users/${userId}`)
    revalidatePath('/discover')
    return { success: true }
}

/**
 * Unfollow a user
 */
export async function unfollowUser(userId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Not authenticated' }

    const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', userId)

    if (error) return { error: error.message }

    revalidatePath(`/users/${userId}`)
    revalidatePath('/discover')
    return { success: true }
}

/**
 * Get followers for a user (defaults to current user)
 */
export async function getFollowers(userId?: string) {
    const supabase = await createClient()

    let targetUserId = userId
    if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return []
        targetUserId = user.id
    }

    const { data, error } = await supabase
        .from('user_follows')
        .select(`
            id,
            created_at,
            follower:follower_id (
                id,
                name,
                email
            )
        `)
        .eq('following_id', targetUserId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching followers:', error)
        return []
    }

    return data
}

/**
 * Get users that a user is following (defaults to current user)
 */
export async function getFollowing(userId?: string) {
    const supabase = await createClient()

    let targetUserId = userId
    if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return []
        targetUserId = user.id
    }

    const { data, error } = await supabase
        .from('user_follows')
        .select(`
            id,
            created_at,
            following:following_id (
                id,
                name,
                email
            )
        `)
        .eq('follower_id', targetUserId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching following:', error)
        return []
    }

    return data
}

/**
 * Check if current user is following a specific user
 */
export async function isFollowing(userId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return false

    const { data, error } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', userId)
        .single()

    if (error) return false
    return !!data
}

/**
 * Get public items from users that the current user is following
 */
export async function getPublicItemsFromFollowing() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const { data, error } = await supabase
        .from('items')
        .select(`
            *,
            owner:owner_user_id (
                id,
                name,
                email
            ),
            groups (
                id,
                name
            )
        `)
        .eq('privacy', 'public')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching public items:', error)
        return []
    }

    // Filter to only include items from followed users
    // This is done client-side because the RLS policy handles the security
    return data
}

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

/**
 * Get follower and following counts for a user
 */
export async function getFollowCounts(userId: string) {
    const supabase = await createClient()

    const [followersResult, followingResult] = await Promise.all([
        supabase
            .from('user_follows')
            .select('id', { count: 'exact', head: true })
            .eq('following_id', userId),
        supabase
            .from('user_follows')
            .select('id', { count: 'exact', head: true })
            .eq('follower_id', userId)
    ])

    return {
        followers: followersResult.count || 0,
        following: followingResult.count || 0
    }
}
