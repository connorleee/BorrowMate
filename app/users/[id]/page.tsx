import { getUserProfile, getUserPublicItems } from '@/app/users/actions'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import FollowButton from './FollowButton'

export default async function UserProfilePage({ params }: { params: { id: string } }) {
    const supabase = await createClient()
    const { data: { user: currentUser } } = await supabase.auth.getUser()

    if (!currentUser) {
        redirect('/auth')
    }

    const userId = params.id
    const [profile, publicItems] = await Promise.all([
        getUserProfile(userId),
        getUserPublicItems(userId)
    ])

    if (!profile) {
        return (
            <div className="flex flex-col gap-8 w-full">
                <h1 className="text-2xl font-bold text-text-primary">User not found</h1>
            </div>
        )
    }

    const isOwnProfile = currentUser.id === userId

    return (
        <div className="flex flex-col gap-6 w-full">
            {/* Profile Header */}
            <div className="bg-surface rounded-lg shadow-sm p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-text-primary mb-2">{profile.name}</h1>
                        <p className="text-text-secondary">{profile.email}</p>
                    </div>

                    {!isOwnProfile && (
                        <FollowButton />
                    )}
                </div>
            </div>

            {/* Public Items */}
            <div className="bg-surface rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-text-primary mb-4">
                    Public Items
                </h2>

                {publicItems.length === 0 ? (
                    <p className="text-text-tertiary">
                        {isOwnProfile
                            ? 'You haven\'t made any items public yet. Set items to public in your groups to share them.'
                            : 'This user hasn\'t shared any public items yet.'}
                    </p>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {publicItems.map((item) => (
                            <div key={item.id} className="border border-border rounded-lg p-4 hover:border-primary-500 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-semibold text-text-primary">{item.name}</h3>
                                    <span className={`px-2 py-1 text-xs rounded-full ${item.status === 'available'
                                        ? 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200'
                                        : 'bg-elevated text-text-secondary'
                                        }`}>
                                        {item.status}
                                    </span>
                                </div>

                                {item.description && (
                                    <p className="text-sm text-text-secondary mb-2">{item.description}</p>
                                )}

                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-text-tertiary">
                                        {item.category && (
                                            <span className="bg-elevated px-2 py-1 rounded">{item.category}</span>
                                        )}
                                    </span>
                                    {item.groups && (
                                        <span className="text-text-tertiary">
                                            from {item.groups.name}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
