'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { authActionClient } from '@/lib/safe-action'
import {
  createGroupSchema,
  joinGroupByInviteCodeSchema,
  regenerateInviteCodeSchema,
  addItemsToGroupSchema,
  addMembersSchema,
} from './schemas'

export const createGroup = authActionClient
  .inputSchema(createGroupSchema)
  .action(async ({ parsedInput: { name, description }, ctx: { user, supabase } }) => {
    // 1. Create Group
    const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
            name,
            description,
            created_by: user.id,
        })
        .select()
        .single()

    if (groupError) {
        throw new Error(groupError.message)
    }

    // 2. Add Creator as Owner
    const { error: membershipError } = await supabase
        .from('group_memberships')
        .insert({
            group_id: group.id,
            user_id: user.id,
            role: 'owner',
        })

    if (membershipError) {
        // Ideally rollback group creation, but for MVP just return error
        throw new Error('Group created but membership failed: ' + membershipError.message)
    }

    revalidatePath('/groups')
    redirect(`/groups/${group.id}`)
  })

export async function getUserGroups() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const { data, error } = await supabase
        .from('group_memberships')
        .select(`
      group_id,
      role,
      groups (
        id,
        name,
        description,
        created_at
      )
    `)
        .eq('user_id', user.id)

    if (error) {
        return []
    }

    return data.map(item => ({
        ...item.groups,
        role: item.role
    }))
}

export async function getGroupDetails(groupId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
        .from('groups')
        .select(`
            *,
            memberships:group_memberships(
                id,
                user_id,
                role
            )
        `)
        .eq('id', groupId)
        .single()

    if (error) return null

    // Collect all user IDs (owner + members) for batch fetch
    const userIds = [
        ...new Set([
            data.created_by,
            ...(data.memberships?.map((m: any) => m.user_id) || [])
        ].filter(Boolean))
    ]

    // Batch fetch names from user_profiles view
    let usersMap: Record<string, { id: string; name: string }> = {}
    if (userIds.length > 0) {
        const { data: profiles } = await supabase
            .from('user_profiles')
            .select('id, name')
            .in('id', userIds)
        if (profiles) {
            usersMap = Object.fromEntries(profiles.map(p => [p.id, p]))
        }
    }

    // Attach owner and user info
    const membershipsWithUsers = data.memberships?.map((m: any) => ({
        ...m,
        user: usersMap[m.user_id] || { id: m.user_id, name: 'Unknown' }
    })) || []

    // Get current user's role in the group
    const userMembership = user ? membershipsWithUsers.find((m: any) => m.user_id === user.id) : null

    return {
        ...data,
        owner: usersMap[data.created_by] || { id: data.created_by, name: 'Unknown' },
        memberships: membershipsWithUsers,
        userRole: userMembership?.role || null,
        memberCount: membershipsWithUsers.length
    }
}

export async function getGroupByInviteCode(inviteCode: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const { data, error } = await supabase
        .from('groups')
        .select(`
            id,
            name,
            description,
            privacy,
            created_at,
            created_by,
            memberships:group_memberships(id)
        `)
        .eq('invite_code', inviteCode.toUpperCase())
        .single()

    if (error) {
        return { error: 'Invalid invite code' }
    }

    // Fetch owner name from user_profiles
    let ownerName = 'Unknown'
    if (data.created_by) {
        const { data: ownerProfile } = await supabase
            .from('user_profiles')
            .select('name')
            .eq('id', data.created_by)
            .single()
        if (ownerProfile) {
            ownerName = ownerProfile.name
        }
    }

    // Check if user is already a member
    const isMember = data.memberships?.some((m: any) => m.user_id === user.id)

    return {
        group: {
            ...data,
            owner: { name: ownerName },
            memberCount: data.memberships?.length || 0
        },
        isMember
    }
}

export const joinGroupByInviteCode = authActionClient
  .inputSchema(joinGroupByInviteCodeSchema)
  .action(async ({ parsedInput: { inviteCode }, ctx: { user, supabase } }) => {
    // First, get the group by invite code
    const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('id')
        .eq('invite_code', inviteCode.toUpperCase())
        .single()

    if (groupError) {
        throw new Error('Invalid invite code')
    }

    // Check if already a member
    const { data: existingMembership } = await supabase
        .from('group_memberships')
        .select('id')
        .eq('group_id', group.id)
        .eq('user_id', user.id)
        .single()

    if (existingMembership) {
        throw new Error('Already a member of this group')
    }

    // Add user as a member
    const { error: membershipError } = await supabase
        .from('group_memberships')
        .insert({
            group_id: group.id,
            user_id: user.id,
            role: 'member'
        })

    if (membershipError) {
        throw new Error('Failed to join group: ' + membershipError.message)
    }

    revalidatePath('/groups')
    revalidatePath(`/groups/${group.id}`)
    return { groupId: group.id }
  })

export const regenerateInviteCode = authActionClient
  .inputSchema(regenerateInviteCodeSchema)
  .action(async ({ parsedInput: { groupId }, ctx: { user, supabase } }) => {
    // Check if user is the owner
    const { data: membership } = await supabase
        .from('group_memberships')
        .select('role')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .single()

    if (!membership || membership.role !== 'owner') {
        throw new Error('Only group owners can regenerate invite codes')
    }

    // Generate new invite code using the database function
    const { data, error } = await supabase.rpc('generate_invite_code')

    if (error) {
        throw new Error('Failed to generate invite code')
    }

    // Update the group with new invite code
    const { error: updateError } = await supabase
        .from('groups')
        .update({ invite_code: data })
        .eq('id', groupId)

    if (updateError) {
        throw new Error('Failed to update invite code')
    }

    revalidatePath(`/groups/${groupId}`)
    return { inviteCode: data }
  })

export const addItemsToGroup = authActionClient
  .inputSchema(addItemsToGroupSchema)
  .action(async ({ parsedInput: { groupId, itemIds }, ctx: { user, supabase } }) => {
    // Verify user is a member of the group
    const { data: membership } = await supabase
        .from('group_memberships')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .single()

    if (!membership) {
        throw new Error('You must be a member of the group to add items')
    }

    // Update items to belong to the group
    const { error } = await supabase
        .from('items')
        .update({ group_id: groupId })
        .in('id', itemIds)
        .eq('owner_user_id', user.id) // Ensure user owns the items

    if (error) {
        throw new Error('Failed to add items to group')
    }

    revalidatePath(`/groups/${groupId}`)
    return { success: true }
  })

export async function searchUsers(query: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return []
    }

    if (!query || query.length < 2) {
        return []
    }

    const { data, error } = await supabase
        .from('user_profiles')
        .select('id, name')
        .ilike('name', `%${query}%`)
        .limit(10)

    if (error) {
        return []
    }

    return data
}

export const addMembers = authActionClient
  .inputSchema(addMembersSchema)
  .action(async ({ parsedInput: { groupId, userIds }, ctx: { user, supabase } }) => {
    // Verify user is a member of the group (enforced by RLS, but good to check)
    const { data: membership } = await supabase
        .from('group_memberships')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .single()

    if (!membership) {
        throw new Error('You must be a member of the group to add others')
    }

    const newMembers = userIds.map(userId => ({
        group_id: groupId,
        user_id: userId,
        role: 'member'
    }))

    const { error } = await supabase
        .from('group_memberships')
        .insert(newMembers)
        // Ignore duplicates if any
        .select()

    if (error) {
        // If it's a unique constraint violation, it means some users are already members.
        if (error.code === '23505') { // unique_violation
            throw new Error('One or more users are already members of this group.')
        }
        throw new Error('Failed to add members: ' + error.message)
    }

    revalidatePath(`/groups/${groupId}`)
    return { success: true }
  })
