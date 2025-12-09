import { getGroupDetails } from '../actions'
import { getGroupItems, getUserItems } from '@/app/items/actions'
import Link from 'next/link'
import ShareGroupLink from './share-group-link'
import GroupItemsManager from './group-items-manager'
import InviteUserButton from '@/components/invite-user-button'
import { ItemCard } from '@/components/Card'

export default async function GroupDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const group = await getGroupDetails(id)
    const items = await getGroupItems(id)
    const userItems = await getUserItems()

    if (!group) {
        return <div>Group not found</div>
    }

    const isOwner = group.userRole === 'owner'

    return (
        <div className="flex flex-col gap-8 w-full">
            <div className="flex flex-col gap-4 border-b pb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-bold">{group.name}</h1>
                            <span className={`text-xs px-2 py-1 rounded-full ${group.privacy === 'public'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                                }`}>
                                {group.privacy}
                            </span>
                        </div>
                        {group.description && <p className="text-gray-600 mt-2">{group.description}</p>}
                        <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
                            <span>Owner: <span className="font-medium">{group.owner?.name || 'Unknown'}</span></span>
                            <span>•</span>
                            <span>{group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}</span>
                        </div>
                    </div>
                    <GroupItemsManager groupId={id} userItems={userItems} />
                </div>

                {group.invite_code && (
                    <ShareGroupLink inviteCode={group.invite_code} groupId={id} />
                )}
            </div>

            {group.memberships && group.memberships.length > 0 && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">Members</h2>
                        <InviteUserButton groupId={id} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {group.memberships.map((membership: any) => (
                            <div key={membership.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                                <div className="flex-1">
                                    <p className="font-medium">{membership.user?.name || 'Unknown'}</p>
                                    <p className="text-xs text-gray-500">{membership.user?.email || ''}</p>
                                </div>
                                {membership.role === 'owner' && (
                                    <span className="text-xs px-2 py-1 bg-primary-100 text-primary-800 rounded-full">
                                        Owner
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div>
                <h2 className="text-2xl font-bold mb-4">Inventory</h2>
                {items.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <p className="text-gray-500">No items in this group yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {items.map((item: any) => (
                            <ItemCard
                                key={item.id}
                                itemId={item.id}
                                name={item.name}
                                description={item.description}
                                status={item.status}
                                variant="compact"
                                className="h-full"
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
