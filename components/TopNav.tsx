import Link from 'next/link'

export default function TopNav() {
    return (
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
            <div className="w-full max-w-4xl flex justify-between items-center p-3 text-sm">
                <div className="flex gap-5 items-center font-semibold text-lg">
                    <Link href="/">BorrowBase</Link>
                </div>
                <div className="flex gap-5 items-center">
                    <span className="text-gray-500">My Household</span>
                    <div className="flex gap-2">
                        {/* Placeholder for user menu */}
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs">
                            U
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    )
}
