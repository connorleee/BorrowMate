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
            <div className="min-h-screen bg-gray-50 p-8">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-2xl font-bold text-gray-900">User not found</h1>
                </div>
            </div>
        )
    }

    const isOwnProfile = currentUser.id === userId

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                {/* Profile Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">{profile.name}</h1>
                            <p className="text-gray-600">{profile.email}</p>
                        </div>

                        {!isOwnProfile && (
                            <FollowButton />
                        )}
                    </div>
                </div>

                {/* Public Items */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                        Public Items
                    </h2>

                    {publicItems.length === 0 ? (
                        <p className="text-gray-500">
                            {isOwnProfile
                                ? 'You haven\'t made any items public yet. Set items to public in your groups to share them.'
                                : 'This user hasn\'t shared any public items yet.'}
                        </p>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {publicItems.map((item) => (
                                <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:border-primary-500 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-semibold text-gray-900">{item.name}</h3>
                                        <span className={`px-2 py-1 text-xs rounded-full ${item.status === 'available'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {item.status}
                                        </span>
                                    </div>

                                    {item.description && (
                                        <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                                    )}

                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">
                                            {item.category && (
                                                <span className="bg-gray-100 px-2 py-1 rounded">{item.category}</span>
                                            )}
                                        </span>
                                        {item.groups && (
                                            <span className="text-gray-500">
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
        </div>
    )
}
