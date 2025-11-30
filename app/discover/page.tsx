import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function DiscoverPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth')
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Discover</h1>
                    <p className="text-gray-600">
                        Coming soon: Browse items shared by other users
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                        Discovery feature is being updated
                    </h2>
                    <p className="text-gray-600 mb-4">
                        We're redesigning the discovery experience to work with the new contact-based lending model.
                    </p>
                    <p className="text-sm text-gray-500">
                        In the meantime, you can manage your contacts and lend directly to them.
                    </p>
                </div>
            </div>
        </div>
    )
}
