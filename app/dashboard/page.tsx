import { getActiveBorrows, getActiveBorrowsGroupedByContact } from '@/app/borrow/actions'
import { getUserItems } from '@/app/items/actions'
import DashboardContent from '@/components/dashboard-content'

export default async function DashboardPage() {
    const [{ borrowed }, userItems, lentGroupedByContact] = await Promise.all([
        getActiveBorrows(),
        getUserItems(),
        getActiveBorrowsGroupedByContact()
    ])

    return <DashboardContent borrowed={borrowed} userItems={userItems} lentGroupedByContact={lentGroupedByContact} />
}
