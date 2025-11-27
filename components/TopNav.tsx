import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { logout } from '@/app/auth/actions'

export default async function TopNav() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    return (
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16 bg-white">
            <div className="w-full max-w-4xl flex justify-between items-center p-3 text-sm">
                <div className="flex gap-5 items-center font-semibold text-lg">
                    <Link href={user ? "/dashboard" : "/"}>BorrowBase</Link>
                </div>
                <div className="flex gap-5 items-center">
                    {user ? (
                        <>
                            <Link href="/dashboard" className="hover:text-gray-600">Dashboard</Link>
                            <Link href="/groups" className="hover:text-gray-600">Groups</Link>
                            <Link href="/items" className="hover:text-gray-600">My Items</Link>
                            <div className="flex items-center gap-4 ml-4 pl-4 border-l">
                                <span className="text-gray-500 hidden sm:inline">{user.user_metadata.name || user.email}</span>
                                <form action={logout}>
                                    <button className="bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded text-xs">
                                        Sign Out
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <Link
                            href="/auth"
                            className="bg-foreground text-background px-4 py-2 rounded-md font-medium hover:opacity-90"
                        >
                            Sign In
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    )
}

