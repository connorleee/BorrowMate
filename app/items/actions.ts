'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getGroupItems(groupId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('items')
    .select(`
      *,
      users:owner_user_id (
        name
      )
    `)
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching items:', error)
    return []
  }

  return data
}

export async function createItem(formData: FormData) {
  const supabase = await createClient()
  const groupId = formData.get('groupId') as string | null
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const category = formData.get('category') as string
  const visibility = formData.get('visibility') as 'shared' | 'personal'

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  console.log('Creating item:', { groupId, name, description, category, visibility, owner_user_id: user.id })

  const { data, error } = await supabase
    .from('items')
    .insert({
      group_id: groupId || null,
      name,
      description,
      category,
      visibility,
      owner_user_id: user.id,
    })
    .select()

  console.log('Insert result:', { data, error })

  if (error) {
    console.error('Error creating item:', error)
    return { error: error.message }
  }

  if (groupId) {
    revalidatePath(`/groups/${groupId}`)
  }
  revalidatePath('/items')
  return { success: true }
}

export async function getItemDetails(itemId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('items')
    .select(`
      *,
      users:owner_user_id (
        name
      ),
      groups (
        id,
        name
      )
    `)
    .eq('id', itemId)
    .single()

  if (error) return null
  return data
}

export async function getUserItems() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  const { data, error } = await supabase
    .from('items')
    .select(`
            *,
            groups (
                id,
                name
            )
        `)
    .eq('owner_user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching user items:', error)
    return []
  }

  return data
}

export async function getBorrowedItems() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  const { data, error } = await supabase
    .from('borrow_records')
    .select(`
            *,
            item:items (
                *,
                owner:users!items_owner_user_id_fkey (
                    name
                )
            )
        `)
    .eq('borrower_user_id', user.id)
    .is('returned_at', null)
    .order('start_date', { ascending: false })

  if (error) {
    console.error('Error fetching borrowed items:', error)
    return []
  }

  return data
}

export async function deleteItem(itemId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('items')
    .delete()
    .eq('id', itemId)
    .eq('owner_user_id', user.id)

  if (error) {
    console.error('Error deleting item:', error)
    return { error: error.message }
  }

  revalidatePath('/items')
  return { success: true }
}

export async function getPotentialBorrowers() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { following: [], groupMembers: [] }

  // Get users the current user follows
  const { data: followingData } = await supabase
    .from('user_follows')
    .select(`
      following:users!user_follows_following_id_fkey (
        id,
        name,
        email
      )
    `)
    .eq('follower_id', user.id)

  // Get all groups the user is a member of
  const { data: userGroups } = await supabase
    .from('group_memberships')
    .select('group_id')
    .eq('user_id', user.id)

  const groupIds = userGroups?.map(g => g.group_id) || []

  // Get unique members from all user's groups (excluding self)
  let groupMembers: any[] = []
  if (groupIds.length > 0) {
    const { data: groupMembersData } = await supabase
      .from('group_memberships')
      .select(`
        user:users (
          id,
          name,
          email
        )
      `)
      .in('group_id', groupIds)
      .neq('user_id', user.id)

    // Deduplicate group members by user ID
    const uniqueMembers = new Map()
    groupMembersData?.forEach((m: any) => {
      if (m.user && !uniqueMembers.has(m.user.id)) {
        uniqueMembers.set(m.user.id, m.user)
      }
    })
    groupMembers = Array.from(uniqueMembers.values())
  }

  return {
    following: followingData?.map((f: any) => f.following).filter(Boolean) || [],
    groupMembers
  }
}

export async function searchPotentialBorrowers(query: string) {
  if (!query || query.length < 2) return []

  const { following, groupMembers } = await getPotentialBorrowers()

  // Combine and deduplicate
  const allRecipients = new Map()
  following.forEach((u: any) => allRecipients.set(u.id, { ...u, source: 'following' }))
  groupMembers.forEach((u: any) => {
    if (allRecipients.has(u.id)) {
      allRecipients.get(u.id).source = 'both'
    } else {
      allRecipients.set(u.id, { ...u, source: 'group' })
    }
  })

  // Filter by query
  const lowerQuery = query.toLowerCase()
  return Array.from(allRecipients.values()).filter((u: any) =>
    u.name.toLowerCase().includes(lowerQuery) ||
    u.email.toLowerCase().includes(lowerQuery)
  )
}

export async function batchLendItems(itemIds: string[], borrowerId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const results = {
    succeeded: [] as string[],
    failed: [] as { itemId: string; error: string }[]
  }

  // Get borrower name for success message
  const { data: borrower } = await supabase
    .from('users')
    .select('name')
    .eq('id', borrowerId)
    .single()

  // Process each item
  for (const itemId of itemIds) {
    try {
      // Verify ownership and that item is personal (null group_id)
      const { data: item, error: fetchError } = await supabase
        .from('items')
        .select('owner_user_id, group_id, status, name')
        .eq('id', itemId)
        .single()

      if (fetchError || !item) {
        results.failed.push({ itemId, error: 'Item not found' })
        continue
      }

      if (item.owner_user_id !== user.id) {
        results.failed.push({ itemId, error: 'Not owner' })
        continue
      }

      if (item.group_id !== null) {
        results.failed.push({ itemId, error: 'Not a personal item' })
        continue
      }

      if (item.status !== 'available') {
        results.failed.push({ itemId, error: 'Item not available' })
        continue
      }

      // Create borrow record with null group_id
      const { error: borrowError } = await supabase
        .from('borrow_records')
        .insert({
          item_id: itemId,
          group_id: null,
          lender_user_id: user.id,
          borrower_user_id: borrowerId,
          start_date: new Date().toISOString(),
          due_date: null,
          status: 'borrowed'
        })

      if (borrowError) {
        results.failed.push({
          itemId,
          error: borrowError.message
        })
        continue
      }

      // Update item status to unavailable
      const { error: updateError } = await supabase
        .from('items')
        .update({ status: 'unavailable' })
        .eq('id', itemId)

      if (updateError) {
        results.failed.push({
          itemId,
          error: 'Status update failed'
        })
        continue
      }

      results.succeeded.push(itemId)
    } catch (err) {
      results.failed.push({
        itemId,
        error: err instanceof Error ? err.message : 'Unknown error'
      })
    }
  }

  // Revalidate paths
  revalidatePath('/items')
  revalidatePath('/dashboard')

  if (results.failed.length === itemIds.length) {
    return {
      error: 'All items failed to lend',
      details: results.failed
    }
  }

  return {
    success: true,
    borrowerName: borrower?.name || 'Unknown',
    ...results
  }
}
