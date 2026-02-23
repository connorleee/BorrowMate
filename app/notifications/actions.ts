'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { authActionClient } from '@/lib/safe-action'
import { markNotificationAsReadSchema, dismissNotificationSchema } from './schemas'

export async function getNotifications(limit = 50) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return []
    }

    // Fetch user's notifications with related data
    const { data: notifications, error } = await supabase
        .from('notifications')
        .select(`
            *,
            sender_contact:contacts!notifications_sender_contact_id_fkey (
                id,
                name
            ),
            related_item:items!notifications_related_item_id_fkey (
                id,
                name,
                category,
                description,
                status
            ),
            related_request:borrow_requests!notifications_related_request_id_fkey (
                id,
                status,
                message,
                requested_due_date,
                created_at,
                requester_user_id,
                item:items (
                    id,
                    name,
                    description,
                    category,
                    status
                )
            )
        `)
        .eq('recipient_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error) {
        return []
    }

    if (!notifications || notifications.length === 0) {
        return []
    }

    // Collect unique user IDs from sender_user_id and related_request.requester_user_id
    const userIds = [
        ...new Set([
            ...notifications.map((n: any) => n.sender_user_id),
            ...notifications
                .map((n: any) => n.related_request?.requester_user_id)
                .filter(Boolean),
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

    // Attach sender and requester info
    return notifications.map((n: any) => ({
        ...n,
        sender: n.sender_user_id
            ? usersMap[n.sender_user_id] || { id: n.sender_user_id, name: 'Unknown' }
            : null,
        related_request: n.related_request
            ? {
                ...n.related_request,
                requester: n.related_request.requester_user_id
                    ? usersMap[n.related_request.requester_user_id] || { id: n.related_request.requester_user_id, name: 'Unknown' }
                    : null,
            }
            : null,
    }))
}

export async function getUnreadNotificationCount() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return 0
    }

    // Count unread notifications
    const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_user_id', user.id)
        .eq('status', 'unread')

    if (error) {
        return 0
    }

    return count || 0
}

export const markNotificationAsRead = authActionClient
  .inputSchema(markNotificationAsReadSchema)
  .action(async ({ parsedInput: { notificationId }, ctx: { user, supabase } }) => {
    // Update notification status to read
    const { error } = await supabase
        .from('notifications')
        .update({ status: 'read' })
        .eq('id', notificationId)
        .eq('recipient_user_id', user.id) // Ensure user owns this notification

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/dashboard')
    revalidatePath('/notifications')

    return { success: true }
  })

export const markAllNotificationsAsRead = authActionClient
  .action(async ({ ctx: { user, supabase } }) => {
    // Update all unread notifications to read
    const { error } = await supabase
        .from('notifications')
        .update({ status: 'read' })
        .eq('recipient_user_id', user.id)
        .eq('status', 'unread')

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/dashboard')
    revalidatePath('/notifications')

    return { success: true }
  })

export async function getPendingBorrowRequests() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return []
    }

    // Fetch pending borrow requests for items owned by this user
    const { data: requests, error } = await supabase
        .from('borrow_requests')
        .select(`
            *,
            item:items (
                id,
                name,
                description,
                category,
                status
            )
        `)
        .eq('owner_user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

    if (error) {
        return []
    }

    if (!requests || requests.length === 0) {
        return []
    }

    // Collect unique requester user IDs
    const requesterIds = [...new Set(requests.map(r => r.requester_user_id).filter(Boolean))]

    // Batch fetch names from user_profiles
    let usersMap: Record<string, { id: string; name: string }> = {}
    if (requesterIds.length > 0) {
        const { data: profiles } = await supabase
            .from('user_profiles')
            .select('id, name')
            .in('id', requesterIds)
        if (profiles) {
            usersMap = Object.fromEntries(profiles.map(p => [p.id, p]))
        }
    }

    // Attach requester info
    return requests.map(r => ({
        ...r,
        requester: usersMap[r.requester_user_id] || { id: r.requester_user_id, name: 'Unknown' }
    }))
}

export async function getPendingRequestsForItems(itemIds: string[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || itemIds.length === 0) {
        return []
    }

    // Fetch pending borrow requests made by this user for specific items
    const { data: requests, error } = await supabase
        .from('borrow_requests')
        .select('id, item_id, status, created_at')
        .eq('requester_user_id', user.id)
        .in('item_id', itemIds)
        .eq('status', 'pending')

    if (error) {
        return []
    }

    return requests || []
}

export const dismissNotification = authActionClient
  .inputSchema(dismissNotificationSchema)
  .action(async ({ parsedInput: { notificationId }, ctx: { user, supabase } }) => {
    // Delete the notification
    const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('recipient_user_id', user.id) // Ensure user owns this notification

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/dashboard')
    revalidatePath('/notifications')

    return { success: true }
  })

export const dismissAllNotifications = authActionClient
  .action(async ({ ctx: { user, supabase } }) => {
    // Delete all notifications for this user
    const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('recipient_user_id', user.id)

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/dashboard')
    revalidatePath('/notifications')

    return { success: true }
  })
