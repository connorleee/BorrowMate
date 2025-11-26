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

    const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single()

    if (error) return null
    return data
}
