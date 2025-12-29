'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getContacts() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  const { data, error } = await supabase
    .from('contacts')
    .select(`
      id,
      owner_user_id,
      name,
      email,
      phone,
      linked_user_id,
      created_at,
      updated_at
    `)
    .eq('owner_user_id', user.id)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching contacts:', JSON.stringify(error, null, 2))
    return []
  }

  return data || []
}

export async function searchContacts(query: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  if (!query || query.length < 2) return []

  const searchTerm = `%${query}%`

  const { data, error } = await supabase
    .from('contacts')
    .select(`
      id,
      owner_user_id,
      name,
      email,
      phone,
      linked_user_id,
      created_at,
      updated_at
    `)
    .eq('owner_user_id', user.id)
    .or(`name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm}`)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error searching contacts:', JSON.stringify(error, null, 2))
    return []
  }

  return data || []
}

export async function createContact(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const name = formData.get('name') as string
  const email = formData.get('email') as string | null
  const phone = formData.get('phone') as string | null

  if (!name || name.trim().length === 0) {
    return { error: 'Contact name is required' }
  }

  const { data, error } = await supabase
    .from('contacts')
    .insert({
      owner_user_id: user.id,
      name: name.trim(),
      email: email ? email.trim() : null,
      phone: phone ? phone.trim() : null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating contact:', error)
    return { error: error.message }
  }

  revalidatePath('/contacts')
  return { data }
}

export async function updateContact(contactId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const name = formData.get('name') as string
  const email = formData.get('email') as string | null
  const phone = formData.get('phone') as string | null

  if (!name || name.trim().length === 0) {
    return { error: 'Contact name is required' }
  }

  // Verify ownership (RLS will enforce, but check client-side too)
  const { data: existingContact, error: fetchError } = await supabase
    .from('contacts')
    .select('owner_user_id')
    .eq('id', contactId)
    .single()

  if (fetchError || !existingContact || existingContact.owner_user_id !== user.id) {
    return { error: 'Unauthorized' }
  }

  const { data, error } = await supabase
    .from('contacts')
    .update({
      name: name.trim(),
      email: email ? email.trim() : null,
      phone: phone ? phone.trim() : null,
    })
    .eq('id', contactId)
    .select()
    .single()

  if (error) {
    console.error('Error updating contact:', error)
    return { error: error.message }
  }

  revalidatePath('/contacts')
  return { data }
}

export async function deleteContact(contactId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Verify ownership
  const { data: existingContact, error: fetchError } = await supabase
    .from('contacts')
    .select('owner_user_id')
    .eq('id', contactId)
    .single()

  if (fetchError || !existingContact || existingContact.owner_user_id !== user.id) {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', contactId)

  if (error) {
    console.error('Error deleting contact:', error)
    return { error: error.message }
  }

  revalidatePath('/contacts')
  return { success: true }
}

export async function linkContactToUser(contactId: string, userId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Verify ownership
  const { data: existingContact, error: fetchError } = await supabase
    .from('contacts')
    .select('owner_user_id')
    .eq('id', contactId)
    .single()

  if (fetchError || !existingContact || existingContact.owner_user_id !== user.id) {
    return { error: 'Unauthorized' }
  }

  const { data, error } = await supabase
    .from('contacts')
    .update({
      linked_user_id: userId,
    })
    .eq('id', contactId)
    .select()
    .single()

  if (error) {
    console.error('Error linking contact to user:', error)
    return { error: error.message }
  }

  revalidatePath('/contacts')
  return { data }
}

export async function getContactWithBorrowHistory(contactId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Fetch contact with ownership verification (RLS enforces, but explicit check too)
  const { data: contact, error: contactError } = await supabase
    .from('contacts')
    .select('id, owner_user_id, name, email, phone, linked_user_id, created_at')
    .eq('id', contactId)
    .single()

  if (contactError || !contact) {
    return { error: 'Contact not found' }
  }

  if (contact.owner_user_id !== user.id) {
    return { error: 'Unauthorized' }
  }

  // Fetch all borrow records for this contact
  const { data: borrowRecords, error: borrowError } = await supabase
    .from('borrow_records')
    .select(`
      id,
      item_id,
      contact_id,
      lender_user_id,
      start_date,
      due_date,
      returned_at,
      status,
      created_at,
      item:items (
        id,
        name,
        description,
        category,
        status
      )
    `)
    .eq('contact_id', contactId)
    .eq('lender_user_id', user.id)
    .order('created_at', { ascending: false })

  if (borrowError) {
    console.error('Error fetching borrow history:', borrowError)
    return { error: borrowError.message }
  }

  // Transform records to ensure item is a single object (not array)
  const records = (borrowRecords || []).map(record => ({
    ...record,
    item: Array.isArray(record.item) ? record.item[0] || null : record.item,
  }))

  const currentlyBorrowed = records.filter(r => r.status === 'borrowed')
  const history = records.filter(r => r.status !== 'borrowed')

  // Fetch items the contact has lent TO the logged-in user (if contact is a linked user)
  let borrowedFromContact: typeof records = []
  if (contact.linked_user_id) {
    const { data: borrowedFromRecords } = await supabase
      .from('borrow_records')
      .select(`
        id,
        item_id,
        contact_id,
        lender_user_id,
        start_date,
        due_date,
        returned_at,
        status,
        created_at,
        item:items (
          id,
          name,
          description,
          category,
          status
        )
      `)
      .eq('lender_user_id', contact.linked_user_id)
      .eq('borrower_user_id', user.id)
      .eq('status', 'borrowed')
      .order('created_at', { ascending: false })

    borrowedFromContact = (borrowedFromRecords || []).map(record => ({
      ...record,
      item: Array.isArray(record.item) ? record.item[0] || null : record.item,
    }))
  }

  return {
    contact,
    currentlyBorrowed,
    borrowedFromContact,
    history,
    stats: {
      currentCount: currentlyBorrowed.length,
      borrowedFromCount: borrowedFromContact.length,
      totalCount: records.length,
    },
  }
}

export async function getPublicItemsForContact(contactId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  // Fetch contact to get linked_user_id
  const { data: contact, error: contactError } = await supabase
    .from('contacts')
    .select('id, owner_user_id, linked_user_id')
    .eq('id', contactId)
    .single()

  if (contactError || !contact) return []
  if (contact.owner_user_id !== user.id) return []
  if (!contact.linked_user_id) return []

  // Fetch public items owned by the linked user
  const { data: items, error: itemsError } = await supabase
    .from('items')
    .select(`
      id,
      name,
      description,
      category,
      status,
      privacy,
      owner_user_id,
      created_at
    `)
    .eq('owner_user_id', contact.linked_user_id)
    .eq('privacy', 'public')
    .order('name', { ascending: true })

  if (itemsError) {
    console.error('Error fetching public items:', itemsError)
    return []
  }

  return items || []
}
