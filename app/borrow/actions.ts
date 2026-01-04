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
    // Note: Only join with items (which exists), not contacts (which may not be migrated yet)
    const { data: borrowRecords, error } = await supabase
        .from('borrow_records')
        .select(`
            id,
            item_id,
            contact_id,
            lender_user_id,
            borrower_user_id,
            start_date,
            due_date,
            returned_at,
            status,
            created_at,
            item:items (
                id,
                name,
                description,
                status,
                category
            )
        `)
        .eq('lender_user_id', user.id)
        .eq('status', 'borrowed')
        .order('contact_id', { ascending: true })
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching active borrows:', JSON.stringify(error, null, 2))
        return []
    }

    // Guard against null/undefined records
    if (!borrowRecords || borrowRecords.length === 0) {
        return []
    }

    // Fetch contacts separately to avoid join issues if table doesn't exist
    let contactsMap: Record<string, any> = {}
    const contactIds = [...new Set(borrowRecords.map(r => r.contact_id).filter(Boolean))]

    if (contactIds.length > 0) {
        const { data: contacts } = await supabase
            .from('contacts')
            .select('id, name, email, phone, linked_user_id')
            .in('id', contactIds)

        if (contacts) {
            contactsMap = Object.fromEntries(contacts.map(c => [c.id, c]))
        }
    }

    // Group records by contact
    const groupedByContact: Record<string, typeof borrowRecords> = {}

    borrowRecords.forEach(record => {
        const contactId = record.contact_id
        if (contactId && !groupedByContact[contactId]) {
            groupedByContact[contactId] = []
        }
        if (contactId) {
            groupedByContact[contactId].push(record)
        }
    })

    // Convert to array format for display
    const result = Object.entries(groupedByContact).map(([contactId, records]) => ({
        contactId,
        contact: contactsMap[contactId] || { id: contactId, name: 'Unknown Contact' },
        items: records,
    }))

    return result
}

export async function createBorrowRequest(itemId: string, contactId: string, dueDate?: string, message?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    // Verify contact ownership and get linked_user_id
    const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .select('owner_user_id, linked_user_id, name')
        .eq('id', contactId)
        .single()

    if (contactError || !contact || contact.owner_user_id !== user.id) {
        return { error: 'Contact not found or unauthorized' }
    }

    if (!contact.linked_user_id) {
        return { error: 'Contact is not linked to a user' }
    }

    // Verify item exists and is owned by the linked user
    const { data: item, error: itemError } = await supabase
        .from('items')
        .select('id, owner_user_id, status, name')
        .eq('id', itemId)
        .single()

    if (itemError || !item || item.owner_user_id !== contact.linked_user_id) {
        return { error: 'Item not found or not owned by contact' }
    }

    if (item.status === 'unavailable') {
        return { error: 'Item is currently unavailable' }
    }

    // Get requester's name for notification
    const { data: requesterUser } = await supabase
        .from('users')
        .select('name')
        .eq('id', user.id)
        .single()

    // Create borrow request (NOT a borrow record - requires owner approval)
    const { data: request, error: requestError } = await supabase
        .from('borrow_requests')
        .insert({
            item_id: itemId,
            requester_user_id: user.id,
            owner_user_id: contact.linked_user_id,
            requested_due_date: dueDate ? new Date(dueDate).toISOString().split('T')[0] : null,
            message: message || null,
            status: 'pending' as const,
        })
        .select()
        .single()

    if (requestError) {
        console.error('Error creating borrow request:', requestError)
        return { error: requestError.message }
    }

    // Create notification for item owner
    const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
            recipient_user_id: contact.linked_user_id,
            sender_user_id: user.id,
            type: 'borrow_request' as const,
            title: `${requesterUser?.name || 'Someone'} wants to borrow your ${item.name}`,
            message: message || null,
            status: 'unread' as const,
            related_item_id: itemId,
            related_request_id: request.id,
            action_url: `/requests/${request.id}`,
        })

    if (notificationError) {
        console.error('Error creating notification:', notificationError)
        // Don't fail the request if notification fails - request is still created
    }

    // Do NOT mark item as unavailable - owner needs to accept first

    revalidatePath('/dashboard')
    revalidatePath('/items')
    revalidatePath(`/contacts/${contactId}`)

    return { data: request }
}

export async function acceptBorrowRequest(requestId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    // Fetch the borrow request (without joins to avoid RLS recursion)
    const { data: request, error: requestError } = await supabase
        .from('borrow_requests')
        .select('*')
        .eq('id', requestId)
        .single()

    if (requestError || !request) {
        return { error: 'Borrow request not found' }
    }

    // Verify user is the owner
    if (request.owner_user_id !== user.id) {
        return { error: 'Unauthorized - you are not the item owner' }
    }

    // Verify request is still pending
    if (request.status !== 'pending') {
        return { error: `Request is already ${request.status}` }
    }

    // Fetch item separately to avoid circular RLS dependencies
    const { data: item, error: itemError } = await supabase
        .from('items')
        .select('id, name, owner_user_id, status')
        .eq('id', request.item_id)
        .single()

    if (itemError || !item) {
        return { error: 'Item not found' }
    }

    // Verify item is still available
    if (item.status === 'unavailable') {
        return { error: 'Item is no longer available' }
    }

    // Fetch requester separately to avoid circular RLS dependencies
    const { data: requester, error: requesterError } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('id', request.requester_user_id)
        .single()

    if (requesterError || !requester) {
        return { error: 'Requester not found' }
    }

    // Update request status to accepted
    const { error: updateRequestError } = await supabase
        .from('borrow_requests')
        .update({
            status: 'accepted' as const,
            responded_at: new Date().toISOString(),
        })
        .eq('id', requestId)

    if (updateRequestError) {
        console.error('Error updating borrow request:', updateRequestError)
        return { error: updateRequestError.message }
    }

    // Find or create contact for the requester (from owner's perspective)
    // First, check if a contact already exists with the linked_user_id
    const { data: linkedContact } = await supabase
        .from('contacts')
        .select('id')
        .eq('owner_user_id', user.id)
        .eq('linked_user_id', request.requester_user_id)
        .single()

    let contactId = linkedContact?.id

    // If not found by linked_user_id, check by email (to avoid duplicates)
    if (!contactId && requester.email) {
        const { data: emailContact } = await supabase
            .from('contacts')
            .select('id, linked_user_id')
            .eq('owner_user_id', user.id)
            .eq('email', requester.email)
            .single()

        if (emailContact) {
            contactId = emailContact.id
            // If contact exists but isn't linked yet, link it now
            if (!emailContact.linked_user_id) {
                await supabase
                    .from('contacts')
                    .update({ linked_user_id: request.requester_user_id })
                    .eq('id', emailContact.id)
            }
        }
    }

    // Only create new contact if no existing match found
    if (!contactId) {
        const { data: newContact, error: contactError } = await supabase
            .from('contacts')
            .insert({
                owner_user_id: user.id,
                name: requester.name,
                linked_user_id: request.requester_user_id,
            })
            .select()
            .single()

        if (contactError || !newContact) {
            console.error('Error creating contact:', contactError)
            return { error: 'Failed to create contact for requester' }
        }

        contactId = newContact.id
    }

    // Create borrow record
    const { data: borrowRecord, error: borrowError } = await supabase
        .from('borrow_records')
        .insert({
            item_id: request.item_id,
            contact_id: contactId,
            lender_user_id: user.id,
            borrower_user_id: request.requester_user_id,
            start_date: new Date().toISOString(),
            due_date: request.requested_due_date ? new Date(request.requested_due_date).toISOString() : null,
            status: 'borrowed' as const,
        })
        .select()
        .single()

    if (borrowError) {
        console.error('Error creating borrow record:', borrowError)
        return { error: borrowError.message }
    }

    // Mark item as unavailable
    const { error: updateItemError } = await supabase
        .from('items')
        .update({ status: 'unavailable' })
        .eq('id', request.item_id)

    if (updateItemError) {
        console.error('Error updating item status:', updateItemError)
        return { error: updateItemError.message }
    }

    // Create notification for requester
    const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
            recipient_user_id: request.requester_user_id,
            sender_user_id: user.id,
            type: 'request_accepted' as const,
            title: `Your request to borrow ${item.name} was accepted`,
            message: null,
            status: 'unread' as const,
            related_item_id: request.item_id,
            related_request_id: requestId,
            related_borrow_record_id: borrowRecord.id,
            action_url: `/dashboard`,
        })

    if (notificationError) {
        console.error('Error creating notification:', notificationError)
        // Don't fail if notification fails
    }

    revalidatePath('/dashboard')
    revalidatePath('/items')
    revalidatePath('/requests')

    return { data: borrowRecord }
}

export async function rejectBorrowRequest(requestId: string, rejectionMessage?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    // Fetch the borrow request (without joins to avoid RLS recursion)
    const { data: request, error: requestError } = await supabase
        .from('borrow_requests')
        .select('*')
        .eq('id', requestId)
        .single()

    if (requestError || !request) {
        return { error: 'Borrow request not found' }
    }

    // Verify user is the owner
    if (request.owner_user_id !== user.id) {
        return { error: 'Unauthorized - you are not the item owner' }
    }

    // Verify request is still pending
    if (request.status !== 'pending') {
        return { error: `Request is already ${request.status}` }
    }

    // Fetch item separately to avoid circular RLS dependencies
    const { data: item, error: itemError } = await supabase
        .from('items')
        .select('id, name')
        .eq('id', request.item_id)
        .single()

    if (itemError || !item) {
        return { error: 'Item not found' }
    }

    // Update request status to rejected
    const { error: updateRequestError } = await supabase
        .from('borrow_requests')
        .update({
            status: 'rejected' as const,
            responded_at: new Date().toISOString(),
        })
        .eq('id', requestId)

    if (updateRequestError) {
        console.error('Error updating borrow request:', updateRequestError)
        return { error: updateRequestError.message }
    }

    // Create notification for requester
    const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
            recipient_user_id: request.requester_user_id,
            sender_user_id: user.id,
            type: 'request_rejected' as const,
            title: `Your request to borrow ${item.name} was declined`,
            message: rejectionMessage || null,
            status: 'unread' as const,
            related_item_id: request.item_id,
            related_request_id: requestId,
            action_url: `/items`,
        })

    if (notificationError) {
        console.error('Error creating notification:', notificationError)
        // Don't fail if notification fails
    }

    revalidatePath('/dashboard')
    revalidatePath('/items')
    revalidatePath('/requests')

    return { success: true }
}
