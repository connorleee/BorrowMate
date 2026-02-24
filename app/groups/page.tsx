import { getUserGroups } from './actions'
import CreateGroupForm from './create-group-form'
import { GroupCard } from '@/components/Card'
import Link from 'next/link'
import { EmptyState } from '@/components/empty-state'

export default async function GroupsPage() {
    const groups = await getUserGroups()

    return (
        <div className="flex flex-col gap-8 w-full max-w-4xl">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">My Groups</h1>
                <CreateGroupForm />
            </div>

            {groups.length === 0 ? (
                <EmptyState
                    message="No groups yet — create one to share items!"
                    ctaLabel="Create Group"
                    ctaHref="/groups"
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groups.map((group: any) => (
                        <Link key={group.id} href={`/groups/${group.id}`} className="block">
                            <GroupCard
                                name={group.name}
                                description={group.description}
                                role={group.role}
                                createdAt={group.created_at}
                            />
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
