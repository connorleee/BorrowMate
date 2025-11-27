import { getPublicItemsFromFollowing, getFollowing } from '@/app/users/actions'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DiscoverPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth')
    }

    const [publicItems, following] = await Promise.all([
        getPublicItemsFromFollowing(),
        getFollowing()
    ])

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Discover</h1>
                    <p className="text-gray-600">
                        Public items from people you follow
                    </p>
                </div>

                {following.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            You're not following anyone yet
                        </h2>
                        <p className="text-gray-600 mb-4">
                            Start following other users to see their public items here.
                        </p>
                        <p className="text-sm text-gray-500">
                            Tip: Visit a user's profile to follow them
                        </p>
                    </div>
                ) : publicItems.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            No public items yet
                        </h2>
                        <p className="text-gray-600">
                            The people you follow haven't shared any public items yet.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Following Summary */}
                        <div className="bg-white rounded-lg shadow-sm p-4">
                            <p className="text-sm text-gray-600">
                                Following <span className="font-semibold text-gray-900">{following.length}</span> {following.length === 1 ? 'person' : 'people'}
                            </p>
                        </div>

                        {/* Items Grid */}
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {publicItems.map((item) => (
                                <div key={item.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="font-semibold text-gray-900 text-lg">{item.name}</h3>
                                        <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${item.status === 'available'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {item.status}
                                        </span>
                                    </div>

                                    {item.description && (
                                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                                    )}

                                    <div className="space-y-2">
                                        {item.category && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs bg-gray-100 px-2 py-1 rounded">{item.category}</span>
                                            </div>
                                        )}

                                        {item.owner && (
                                            <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100">
                                                <Link
                                                    href={`/users/${item.owner.id}`}
                                                    className="text-blue-600 hover:text-blue-800 font-medium"
                                                >
                                                    {item.owner.name}
                                                </Link>
                                                {item.groups && (
                                                    <span className="text-gray-500 text-xs">
                                                        {item.groups.name}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
