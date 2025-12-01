import { getUserItems, getBorrowedItems } from './actions'
import ItemsPageContent from '@/components/items-page-content'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export default async function ItemsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth')
    }

    const [userItems, borrowedItems] = await Promise.all([
        getUserItems(),
        getBorrowedItems()
    ])

    return <ItemsPageContent borrowedItems={borrowedItems} userItems={userItems} />
}
