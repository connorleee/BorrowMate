import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function DiscoverPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth')
    }

    return (
        <div className="flex flex-col gap-8 w-full">
            <div>
                <h1 className="text-3xl font-bold text-text-primary mb-2">Discover</h1>
                <p className="text-text-secondary">
                    Coming soon: Browse items shared by other users
                </p>
            </div>

            <div className="bg-surface rounded-lg shadow-sm p-8 text-center">
                <h2 className="text-xl font-semibold text-text-primary mb-2">
                    Discovery feature is being updated
                </h2>
                <p className="text-text-secondary mb-4">
                    We're redesigning the discovery experience to work with the new contact-based lending model.
                </p>
                <p className="text-sm text-text-tertiary">
                    In the meantime, you can manage your contacts and lend directly to them.
                </p>
            </div>
        </div>
    )
}
