'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

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
            sender:users!notifications_sender_user_id_fkey (
                id,
                name,
                email
            ),
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
                requester:users!borrow_requests_requester_user_id_fkey (
                    id,
                    name,
                    email
                ),
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
        console.error('Error fetching notifications:', error)
        return []
    }

    return notifications || []
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
        console.error('Error fetching unread count:', error)
        return 0
    }

    return count || 0
}

export async function markNotificationAsRead(notificationId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    // Update notification status to read
    const { error } = await supabase
        .from('notifications')
        .update({ status: 'read' })
        .eq('id', notificationId)
        .eq('recipient_user_id', user.id) // Ensure user owns this notification

    if (error) {
        console.error('Error marking notification as read:', error)
        return { error: error.message }
    }

    revalidatePath('/dashboard')
    revalidatePath('/notifications')

    return { success: true }
}

export async function markAllNotificationsAsRead() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    // Update all unread notifications to read
    const { error } = await supabase
        .from('notifications')
        .update({ status: 'read' })
        .eq('recipient_user_id', user.id)
        .eq('status', 'unread')

    if (error) {
        console.error('Error marking all notifications as read:', error)
        return { error: error.message }
    }

    revalidatePath('/dashboard')
    revalidatePath('/notifications')

    return { success: true }
}

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
            ),
            requester:users!borrow_requests_requester_user_id_fkey (
                id,
                name,
                email
            )
        `)
        .eq('owner_user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching pending borrow requests:', error)
        return []
    }

    return requests || []
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
        console.error('Error fetching pending requests for items:', error)
        return []
    }

    return requests || []
}

export async function dismissNotification(notificationId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    // Delete the notification
    const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('recipient_user_id', user.id) // Ensure user owns this notification

    if (error) {
        console.error('Error dismissing notification:', error)
        return { error: error.message }
    }

    revalidatePath('/dashboard')
    revalidatePath('/notifications')

    return { success: true }
}

export async function dismissAllNotifications() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    // Delete all notifications for this user
    const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('recipient_user_id', user.id)

    if (error) {
        console.error('Error dismissing all notifications:', error)
        return { error: error.message }
    }

    revalidatePath('/dashboard')
    revalidatePath('/notifications')

    return { success: true }
}
