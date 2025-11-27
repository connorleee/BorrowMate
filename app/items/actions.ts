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
