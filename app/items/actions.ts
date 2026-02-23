'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { authActionClient } from '@/lib/safe-action'
import { createItemSchema, deleteItemSchema, updateItemSchema } from './schemas'

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
    return []
  }

  return data
}

export const createItem = authActionClient
  .inputSchema(createItemSchema)
  .action(async ({ parsedInput: { name, description, category, privacy, groupId }, ctx: { user, supabase } }) => {
    const { data, error } = await supabase
      .from('items')
      .insert({
        group_id: groupId || null,
        name,
        description,
        category,
        privacy,
        owner_user_id: user.id,
      })
      .select()

    if (error) {
      throw new Error(error.message)
    }

    if (groupId) {
      revalidatePath(`/groups/${groupId}`)
    }
    revalidatePath('/items')
    return { success: true }
  })

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
    return []
  }

  return data
}

export const deleteItem = authActionClient
  .inputSchema(deleteItemSchema)
  .action(async ({ parsedInput: { itemId }, ctx: { user, supabase } }) => {
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', itemId)
      .eq('owner_user_id', user.id)

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/items')
    return { success: true }
  })

export async function getItemDetailsWithBorrow(itemId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch item details with owner and group info
  const { data: item, error: itemError } = await supabase
    .from('items')
    .select(`
      *,
      users:owner_user_id (
        id,
        name
      ),
      groups (
        id,
        name
      )
    `)
    .eq('id', itemId)
    .single()

  if (itemError || !item) return null

  // Fetch active borrow record if item is borrowed
  let activeBorrow = null
  let contact = null

  if (item.status === 'unavailable') {
    const { data: borrowRecord } = await supabase
      .from('borrow_records')
      .select('id, contact_id, start_date, due_date, lender_user_id, borrower_user_id')
      .eq('item_id', itemId)
      .eq('status', 'borrowed')
      .single()

    if (borrowRecord) {
      activeBorrow = borrowRecord

      // Fetch contact info
      const { data: contactData } = await supabase
        .from('contacts')
        .select('id, name, email, phone, linked_user_id')
        .eq('id', borrowRecord.contact_id)
        .single()

      contact = contactData
    }
  }

  return {
    item,
    activeBorrow,
    contact,
    isOwner: user?.id === item.owner_user_id,
  }
}

export async function getItemBorrowHistory(itemId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  // First, fetch the item to check if user is owner
  const { data: item } = await supabase
    .from('items')
    .select('owner_user_id')
    .eq('id', itemId)
    .single()

  // Only return history if user is the item owner
  if (!item || item.owner_user_id !== user.id) {
    return []
  }

  // Fetch all borrow records for this item
  const { data: borrowRecords, error } = await supabase
    .from('borrow_records')
    .select('id, contact_id, start_date, due_date, returned_at, status, created_at')
    .eq('item_id', itemId)
    .order('created_at', { ascending: false })

  if (error || !borrowRecords) return []

  // Fetch contacts for all borrow records
  const contactIds = [...new Set(borrowRecords.map(r => r.contact_id).filter(Boolean))]
  let contactsMap: Record<string, any> = {}

  if (contactIds.length > 0) {
    const { data: contacts } = await supabase
      .from('contacts')
      .select('id, name, email, phone')
      .in('id', contactIds)

    if (contacts) {
      contactsMap = Object.fromEntries(contacts.map(c => [c.id, c]))
    }
  }

  // Enrich borrow records with contact info
  return borrowRecords.map(record => ({
    ...record,
    contact: contactsMap[record.contact_id] || { id: record.contact_id, name: 'Unknown' },
  }))
}

export const updateItem = authActionClient
  .inputSchema(updateItemSchema)
  .action(async ({ parsedInput: { itemId, name, description, category, price_usd }, ctx: { user, supabase } }) => {
    // Check if user is the item owner
    const { data: item } = await supabase
      .from('items')
      .select('owner_user_id')
      .eq('id', itemId)
      .single()

    if (!item || item.owner_user_id !== user.id) {
      throw new Error('Not authorized to update this item')
    }

    // Update item
    const { error } = await supabase
      .from('items')
      .update({
        ...(name && { name }),
        ...(description && { description }),
        ...(category && { category }),
        ...(price_usd !== undefined && { price_usd }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', itemId)

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/items')
    revalidatePath(`/items/${itemId}`)
    return { success: true }
  })

// DEPRECATED: These functions are replaced by contact-centric lending model
// - getPotentialBorrowers() → Use contacts instead (app/contacts/actions.ts)
// - searchPotentialBorrowers() → Use searchContacts() instead
// - batchLendItems() → Use batchLendToContact() instead (app/borrow/actions.ts)
