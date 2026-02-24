import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { logout } from '@/app/auth/actions'

async function handleLogout() {
    'use server'
    await logout()
}

export default async function TopNav() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    return (
        <nav className="w-full flex justify-center border-b border-[var(--border)] h-16 bg-[var(--bg-base)]">
            <div className="w-full max-w-4xl flex justify-between items-center p-3 text-sm">
                <div className="flex gap-5 items-center font-semibold text-lg">
                    <Link href={user ? "/dashboard" : "/"}>BorrowBase</Link>
                </div>
                <div className="flex gap-5 items-center">
                    {user ? (
                        <>
                            <Link href="/dashboard" className="hover:text-[var(--text-secondary)]">Dashboard</Link>
                            <Link href="/items" className="hover:text-[var(--text-secondary)]">My Items</Link>
                            <Link href="/contacts" className="hover:text-[var(--text-secondary)]">Contacts</Link>
                            <Link href="/groups" className="hover:text-[var(--text-secondary)]">Groups</Link>
                            <div className="flex items-center gap-4 ml-4 pl-4 border-l border-[var(--border)]">
                                <span className="text-[var(--text-tertiary)] hidden sm:inline">{user.user_metadata.name || user.email}</span>
                                <form action={handleLogout}>
                                    <button className="bg-[var(--bg-elevated)] hover:bg-[var(--bg-surface)] px-3 py-1 rounded text-xs">
                                        Sign Out
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <Link
                            href="/auth"
                            className="bg-primary-500 text-white px-4 py-2 rounded-md font-medium hover:bg-primary-600 transition-colors"
                        >
                            Sign In
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    )
}
