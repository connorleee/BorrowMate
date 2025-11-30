'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function borrowItem(formData: FormData) {
    const supabase = await createClient()
    const itemId = formData.get('itemId') as string
    const groupId = formData.get('groupId') as string
    const startDate = formData.get('startDate') as string
    const dueDate = formData.get('dueDate') as string
    const borrowerName = formData.get('borrowerName') as string // Optional if external
    // For MVP, we assume the logged-in user is the borrower if they are borrowing it themselves.
    // But the spec says "Mark item as borrowed: borrower (member of group or free-form name)".
    // So we need to handle "I am borrowing" vs "Someone else is borrowing".
    // For simplicity, let's assume the logged-in user is marking it.
    // If they are the owner, they are lending it to someone.
    // If they are NOT the owner, they are borrowing it (requesting? or just taking?).
    // Spec says: "As a member, I can mark an item as borrowed by someone".

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    // Fetch item to check owner
    const { data: item } = await supabase.from('items').select('owner_user_id').eq('id', itemId).single()

    let lenderId = item?.owner_user_id
    let borrowerId = null
    let finalBorrowerName = borrowerName

    if (lenderId === user.id) {
        // I am the owner, I am lending it to someone
        // borrowerId could be selected from a list (not implemented yet) or null (external)
        // For MVP, let's just use borrowerName for external, or if we had a user picker...
        // Let's stick to borrowerName for simplicity if not self.
    } else {
        // I am borrowing it
        borrowerId = user.id
        lenderId = item?.owner_user_id // The owner is the lender
    }

    // Insert Borrow Record
    const { error: borrowError } = await supabase
        .from('borrow_records')
        .insert({
            item_id: itemId,
            group_id: groupId,
            lender_user_id: lenderId,
            borrower_user_id: borrowerId,
            borrower_name: finalBorrowerName,
            start_date: new Date(startDate).toISOString(),
            due_date: dueDate ? new Date(dueDate).toISOString() : null,
            status: 'borrowed',
        })

    if (borrowError) return { error: borrowError.message }

    // Update Item Status
    const { error: itemError } = await supabase
        .from('items')
        .update({ status: 'unavailable' })
        .eq('id', itemId)

    if (itemError) return { error: itemError.message }

    if (groupId) {
        revalidatePath(`/groups/${groupId}`)
    }
    revalidatePath(`/items/${itemId}`)
    redirect(`/groups/${groupId}`)
}

export async function returnItem(recordId: string, itemId: string, groupId: string) {
    const supabase = await createClient()

    // Update Borrow Record
    const { error: borrowError } = await supabase
        .from('borrow_records')
        .update({
            status: 'returned',
            returned_at: new Date().toISOString(),
        })
        .eq('id', recordId)

    if (borrowError) return { error: borrowError.message }

    // Update Item Status
    const { error: itemError } = await supabase
        .from('items')
        .update({ status: 'available' })
        .eq('id', itemId)

    if (itemError) return { error: itemError.message }

    if (groupId) {
        revalidatePath(`/groups/${groupId}`)
    }
    revalidatePath(`/items/${itemId}`)
    revalidatePath('/dashboard')
}

export async function getActiveBorrows() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { borrowed: [], lent: [] }

    // Items I am borrowing
    const { data: borrowed } = await supabase
        .from('borrow_records')
        .select(`
            *,
            item:items (
                id,
                name,
                description,
                status,
                category
            ),
            lender:users!borrow_records_lender_user_id_fkey (
                id,
                name,
                email
            )
        `)
        .eq('borrower_user_id', user.id)
        .eq('status', 'borrowed')

    // Items I lent out
    const { data: lent } = await supabase
        .from('borrow_records')
        .select(`
            *,
            item:items (
                id,
                name,
                description,
                status,
                category
            ),
            borrower:users!borrow_records_borrower_user_id_fkey (
                id,
                name,
                email
            )
        `)
        .eq('lender_user_id', user.id)
        .eq('status', 'borrowed')

    return { borrowed: borrowed || [], lent: lent || [] }
}

// Contact-centric lending functions (new, per CLAUDE.md)

export async function batchLendToContact(itemIds: string[], contactId: string, dueDate?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    // Verify contact ownership
    const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .select('owner_user_id, linked_user_id')
        .eq('id', contactId)
        .single()

    if (contactError || !contact || contact.owner_user_id !== user.id) {
        return { error: 'Contact not found or unauthorized' }
    }

    // Verify all items are owned by user
    const { data: items, error: itemsError } = await supabase
        .from('items')
        .select('id, status')
        .in('id', itemIds)

    if (itemsError || !items || items.length !== itemIds.length) {
        return { error: 'Some items not found' }
    }

    if (items.some(item => item.status === 'unavailable')) {
        return { error: 'Some items are already unavailable' }
    }

    // Create borrow records for each item
    const borrowRecords = itemIds.map(itemId => ({
        item_id: itemId,
        contact_id: contactId,
        lender_user_id: user.id,
        borrower_user_id: contact.linked_user_id || null,
        start_date: new Date().toISOString(),
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        status: 'borrowed' as const,
    }))

    const { data: records, error: insertError } = await supabase
        .from('borrow_records')
        .insert(borrowRecords)
        .select()

    if (insertError) {
        console.error('Error creating borrow records:', insertError)
        return { error: insertError.message }
    }

    // Update item statuses to unavailable
    const { error: updateError } = await supabase
        .from('items')
        .update({ status: 'unavailable' })
        .in('id', itemIds)

    if (updateError) {
        console.error('Error updating item statuses:', updateError)
        return { error: updateError.message }
    }

    revalidatePath('/dashboard')
    revalidatePath('/items')

    return { data: records }
}

export async function getOrCreateContactForGroupMember(groupMemberId: string, memberName?: string, memberEmail?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    // Check if a contact already exists linking this user to the group member
    const { data: existingContact } = await supabase
        .from('contacts')
        .select('id')
        .eq('owner_user_id', user.id)
        .eq('linked_user_id', groupMemberId)
        .single()

    if (existingContact) {
        return { data: existingContact }
    }

    // Fetch group member details if not provided
    let contactName = memberName
    let contactEmail = memberEmail

    if (!contactName) {
        const { data: member } = await supabase
            .from('users')
            .select('name, email')
            .eq('id', groupMemberId)
            .single()

        contactName = member?.name || 'Unknown'
        contactEmail = member?.email
    }

    // Create new contact
    const { data: newContact, error } = await supabase
        .from('contacts')
        .insert({
            owner_user_id: user.id,
            name: contactName,
            email: contactEmail,
            linked_user_id: groupMemberId,
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating contact for group member:', error)
        return { error: error.message }
    }

    return { data: newContact }
}

export async function getActiveBorrowsGroupedByContact() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return []
    }

    // Fetch all active borrow records for items lent by this user
    const { data: borrowRecords, error } = await supabase
        .from('borrow_records')
        .select(`
            *,
            item:items (
                id,
                name,
                description,
                status,
                category
            ),
            contact:contacts (
                id,
                name,
                email,
                phone,
                linked_user_id
            )
        `)
        .eq('lender_user_id', user.id)
        .eq('status', 'borrowed')
        .order('contact_id', { ascending: true })
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching active borrows:', error)
        return []
    }

    // Group records by contact
    const groupedByContact: Record<string, typeof borrowRecords> = {}

    borrowRecords?.forEach(record => {
        const contactId = record.contact_id
        if (!groupedByContact[contactId]) {
            groupedByContact[contactId] = []
        }
        groupedByContact[contactId].push(record)
    })

    // Convert to array format for display
    const result = Object.entries(groupedByContact).map(([contactId, records]) => ({
        contactId,
        contact: records[0]?.contact,
        items: records,
    }))

    return result
}
