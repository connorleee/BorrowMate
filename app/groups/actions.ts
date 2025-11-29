'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createGroup(formData: FormData) {
    const supabase = await createClient()
    const name = formData.get('name') as string
    const description = formData.get('description') as string

    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) {
        return { error: 'Not authenticated' }
    }

    // 1. Create Group
    const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
            name,
            description,
            created_by: userData.user.id,
        })
        .select()
        .single()

    if (groupError) {
        return { error: groupError.message }
    }

    // 2. Add Creator as Owner (Trigger might handle this? No, I didn't add a trigger for this in migration)
    // I added a policy "Group creators can insert membership for themselves", so I should do it here.
    const { error: membershipError } = await supabase
        .from('group_memberships')
        .insert({
            group_id: group.id,
            user_id: userData.user.id,
            role: 'owner',
        })

    if (membershipError) {
        // Ideally rollback group creation, but for MVP just return error
        return { error: 'Group created but membership failed: ' + membershipError.message }
    }

    revalidatePath('/groups')
    redirect(`/groups/${group.id}`)
}

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
        console.error('Error fetching groups:', error)
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
            owner:created_by(id, name, email),
            memberships:group_memberships(
                id,
                role,
                user:users(id, name, email)
            )
        `)
        .eq('id', groupId)
        .single()

    if (error) return null

    // Get current user's role in the group
    const userMembership = user ? data.memberships?.find((m: any) => m.user.id === user.id) : null

    return {
        ...data,
        userRole: userMembership?.role || null,
        memberCount: data.memberships?.length || 0
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
            owner:created_by(name),
            memberships:group_memberships(id)
        `)
        .eq('invite_code', inviteCode.toUpperCase())
        .single()

    if (error) {
        return { error: 'Invalid invite code' }
    }

    // Check if user is already a member
    const isMember = data.memberships?.some((m: any) => m.user_id === user.id)

    return {
        group: {
            ...data,
            memberCount: data.memberships?.length || 0
        },
        isMember
    }
}

export async function joinGroupByInviteCode(inviteCode: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    // First, get the group by invite code
    const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('id')
        .eq('invite_code', inviteCode.toUpperCase())
        .single()

    if (groupError) {
        return { error: 'Invalid invite code' }
    }

    // Check if already a member
    const { data: existingMembership } = await supabase
        .from('group_memberships')
        .select('id')
        .eq('group_id', group.id)
        .eq('user_id', user.id)
        .single()

    if (existingMembership) {
        return { error: 'Already a member of this group', groupId: group.id }
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
        return { error: 'Failed to join group: ' + membershipError.message }
    }

    revalidatePath('/groups')
    revalidatePath(`/groups/${group.id}`)
    return { success: true, groupId: group.id }
}

export async function regenerateInviteCode(groupId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    // Check if user is the owner
    const { data: membership } = await supabase
        .from('group_memberships')
        .select('role')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .single()

    if (!membership || membership.role !== 'owner') {
        return { error: 'Only group owners can regenerate invite codes' }
    }

    // Generate new invite code using the database function
    const { data, error } = await supabase.rpc('generate_invite_code')

    if (error) {
        return { error: 'Failed to generate invite code' }
    }

    // Update the group with new invite code
    const { error: updateError } = await supabase
        .from('groups')
        .update({ invite_code: data })
        .eq('id', groupId)

    if (updateError) {
        return { error: 'Failed to update invite code' }
    }

    revalidatePath(`/groups/${groupId}`)
    return { success: true, inviteCode: data }
}

export async function addItemsToGroup(groupId: string, itemIds: string[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    // Verify user is a member of the group
    const { data: membership } = await supabase
        .from('group_memberships')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .single()

    if (!membership) {
        return { error: 'You must be a member of the group to add items' }
    }

    // Update items to belong to the group
    const { error } = await supabase
        .from('items')
        .update({ group_id: groupId })
        .in('id', itemIds)
        .eq('owner_user_id', user.id) // Ensure user owns the items

    if (error) {
        console.error('Error adding items to group:', error)
        return { error: 'Failed to add items to group' }
    }

    revalidatePath(`/groups/${groupId}`)
    return { success: true }
}

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
        .from('users')
        .select('id, name, email')
        .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(10)

    if (error) {
        console.error('Error searching users:', error)
        return []
    }

    return data
}

export async function addMembers(groupId: string, userIds: string[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    // Verify user is a member of the group (enforced by RLS, but good to check)
    const { data: membership } = await supabase
        .from('group_memberships')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .single()

    if (!membership) {
        return { error: 'You must be a member of the group to add others' }
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
        // We can probably ignore that for now or handle it more gracefully.
        if (error.code === '23505') { // unique_violation
            return { error: 'One or more users are already members of this group.' }
        }
        console.error('Error adding members:', error)
        return { error: 'Failed to add members: ' + error.message }
    }

    revalidatePath(`/groups/${groupId}`)
    return { success: true }
}
