'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { authActionClient } from '@/lib/safe-action'
import {
  borrowItemSchema,
  returnItemSchema,
  batchLendToContactSchema,
  createBorrowRequestSchema,
  acceptBorrowRequestSchema,
  rejectBorrowRequestSchema,
  getOrCreateContactForGroupMemberSchema,
} from './schemas'

export const borrowItem = authActionClient
  .inputSchema(borrowItemSchema)
  .action(async ({ parsedInput: { itemId, groupId, startDate, dueDate, borrowerName }, ctx: { user, supabase } }) => {
    // Fetch item to check owner
    const { data: item } = await supabase.from('items').select('owner_user_id').eq('id', itemId).single()

    let lenderId = item?.owner_user_id
    let borrowerId = null
    let finalBorrowerName = borrowerName

    if (lenderId === user.id) {
        // I am the owner, I am lending it to someone
    } else {
        // I am borrowing it
        borrowerId = user.id
        lenderId = item?.owner_user_id
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

    if (borrowError) throw new Error(borrowError.message)

    // Update Item Status
    const { error: itemError } = await supabase
        .from('items')
        .update({ status: 'unavailable' })
        .eq('id', itemId)

    if (itemError) throw new Error(itemError.message)

    if (groupId) {
        revalidatePath(`/groups/${groupId}`)
    }
    revalidatePath(`/items/${itemId}`)
    redirect(`/groups/${groupId}`)
  })

export const returnItem = authActionClient
  .inputSchema(returnItemSchema)
  .action(async ({ parsedInput: { recordId, itemId, groupId }, ctx: { user, supabase } }) => {
    // Update Borrow Record
    const { error: borrowError } = await supabase
        .from('borrow_records')
        .update({
            status: 'returned',
            returned_at: new Date().toISOString(),
        })
        .eq('id', recordId)

    if (borrowError) throw new Error(borrowError.message)

    // Update Item Status
    const { error: itemError } = await supabase
        .from('items')
        .update({ status: 'available' })
        .eq('id', itemId)

    if (itemError) throw new Error(itemError.message)

    if (groupId) {
        revalidatePath(`/groups/${groupId}`)
    }
    revalidatePath(`/items/${itemId}`)
    revalidatePath('/dashboard')
  })

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
            )
        `)
        .eq('lender_user_id', user.id)
        .eq('status', 'borrowed')

    // Collect all unique user IDs for batch fetch
    const userIds = [
        ...new Set([
            ...(borrowed || []).map(r => r.lender_user_id),
            ...(lent || []).map(r => r.borrower_user_id),
        ].filter(Boolean))
    ]

    // Batch fetch names from user_profiles
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

    // Attach lender/borrower info
    const borrowedWithUsers = (borrowed || []).map(r => ({
        ...r,
        lender: usersMap[r.lender_user_id] || { id: r.lender_user_id, name: 'Unknown' }
    }))

    const lentWithUsers = (lent || []).map(r => ({
        ...r,
        borrower: r.borrower_user_id
            ? usersMap[r.borrower_user_id] || { id: r.borrower_user_id, name: 'Unknown' }
            : null
    }))

    return { borrowed: borrowedWithUsers, lent: lentWithUsers }
}

// Contact-centric lending functions (new, per CLAUDE.md)

export const batchLendToContact = authActionClient
  .inputSchema(batchLendToContactSchema)
  .action(async ({ parsedInput: { itemIds, contactId, dueDate }, ctx: { user, supabase } }) => {
    // Verify contact ownership
    const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .select('owner_user_id, linked_user_id')
        .eq('id', contactId)
        .single()

    if (contactError || !contact || contact.owner_user_id !== user.id) {
        throw new Error('Contact not found or unauthorized')
    }

    // Verify all items are owned by user
    const { data: items, error: itemsError } = await supabase
        .from('items')
        .select('id, status')
        .in('id', itemIds)

    if (itemsError || !items || items.length !== itemIds.length) {
        throw new Error('Some items not found')
    }

    if (items.some(item => item.status === 'unavailable')) {
        throw new Error('Some items are already unavailable')
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
        throw new Error(insertError.message)
    }

    // Update item statuses to unavailable
    const { error: updateError } = await supabase
        .from('items')
        .update({ status: 'unavailable' })
        .in('id', itemIds)

    if (updateError) {
        throw new Error(updateError.message)
    }

    revalidatePath('/dashboard')
    revalidatePath('/items')

    return { data: records }
  })

export const getOrCreateContactForGroupMember = authActionClient
  .inputSchema(getOrCreateContactForGroupMemberSchema)
  .action(async ({ parsedInput: { groupMemberId, memberName, memberEmail }, ctx: { user, supabase } }) => {
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
            .from('user_profiles')
            .select('name')
            .eq('id', groupMemberId)
            .single()

        contactName = member?.name || 'Unknown'
        contactEmail = undefined
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
        throw new Error(error.message)
    }

    return { data: newContact }
  })

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

export const createBorrowRequest = authActionClient
  .inputSchema(createBorrowRequestSchema)
  .action(async ({ parsedInput: { itemId, contactId, dueDate, message }, ctx: { user, supabase } }) => {
    // Verify contact ownership and get linked_user_id
    const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .select('owner_user_id, linked_user_id, name')
        .eq('id', contactId)
        .single()

    if (contactError || !contact || contact.owner_user_id !== user.id) {
        throw new Error('Contact not found or unauthorized')
    }

    if (!contact.linked_user_id) {
        throw new Error('Contact is not linked to a user')
    }

    // Verify item exists and is owned by the linked user
    const { data: item, error: itemError } = await supabase
        .from('items')
        .select('id, owner_user_id, status, name')
        .eq('id', itemId)
        .single()

    if (itemError || !item || item.owner_user_id !== contact.linked_user_id) {
        throw new Error('Item not found or not owned by contact')
    }

    if (item.status === 'unavailable') {
        throw new Error('Item is currently unavailable')
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
        throw new Error(requestError.message)
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
        // Don't fail the request if notification fails - request is still created
    }

    // Do NOT mark item as unavailable - owner needs to accept first

    revalidatePath('/dashboard')
    revalidatePath('/items')
    revalidatePath(`/contacts/${contactId}`)

    return { data: request }
  })

export const acceptBorrowRequest = authActionClient
  .inputSchema(acceptBorrowRequestSchema)
  .action(async ({ parsedInput: { requestId }, ctx: { user, supabase } }) => {
    // Fetch the borrow request (without joins to avoid RLS recursion)
    const { data: request, error: requestError } = await supabase
        .from('borrow_requests')
        .select('*')
        .eq('id', requestId)
        .single()

    if (requestError || !request) {
        throw new Error('Borrow request not found')
    }

    // Verify user is the owner
    if (request.owner_user_id !== user.id) {
        throw new Error('Unauthorized - you are not the item owner')
    }

    // Verify request is still pending
    if (request.status !== 'pending') {
        throw new Error(`Request is already ${request.status}`)
    }

    // Fetch item separately to avoid circular RLS dependencies
    const { data: item, error: itemError } = await supabase
        .from('items')
        .select('id, name, owner_user_id, status')
        .eq('id', request.item_id)
        .single()

    if (itemError || !item) {
        throw new Error('Item not found')
    }

    // Verify item is still available
    if (item.status === 'unavailable') {
        throw new Error('Item is no longer available')
    }

    // Fetch requester via user_profiles view (does not expose email/phone)
    const { data: requester, error: requesterError } = await supabase
        .from('user_profiles')
        .select('id, name')
        .eq('id', request.requester_user_id)
        .single()

    if (requesterError || !requester) {
        throw new Error('Requester not found')
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
        throw new Error(updateRequestError.message)
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

    // Email-based contact dedup removed: user_profiles view does not expose email (PII protection).
    // Contact dedup relies on linked_user_id lookup above.

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
            throw new Error('Failed to create contact for requester')
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
        throw new Error(borrowError.message)
    }

    // Mark item as unavailable
    const { error: updateItemError } = await supabase
        .from('items')
        .update({ status: 'unavailable' })
        .eq('id', request.item_id)

    if (updateItemError) {
        throw new Error(updateItemError.message)
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
        // Don't fail if notification fails
    }

    revalidatePath('/dashboard')
    revalidatePath('/items')
    revalidatePath('/requests')

    return { data: borrowRecord }
  })

export const rejectBorrowRequest = authActionClient
  .inputSchema(rejectBorrowRequestSchema)
  .action(async ({ parsedInput: { requestId, rejectionMessage }, ctx: { user, supabase } }) => {
    // Fetch the borrow request (without joins to avoid RLS recursion)
    const { data: request, error: requestError } = await supabase
        .from('borrow_requests')
        .select('*')
        .eq('id', requestId)
        .single()

    if (requestError || !request) {
        throw new Error('Borrow request not found')
    }

    // Verify user is the owner
    if (request.owner_user_id !== user.id) {
        throw new Error('Unauthorized - you are not the item owner')
    }

    // Verify request is still pending
    if (request.status !== 'pending') {
        throw new Error(`Request is already ${request.status}`)
    }

    // Fetch item separately to avoid circular RLS dependencies
    const { data: item, error: itemError } = await supabase
        .from('items')
        .select('id, name')
        .eq('id', request.item_id)
        .single()

    if (itemError || !item) {
        throw new Error('Item not found')
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
        throw new Error(updateRequestError.message)
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
        // Don't fail if notification fails
    }

    revalidatePath('/dashboard')
    revalidatePath('/items')
    revalidatePath('/requests')

    return { success: true }
  })
