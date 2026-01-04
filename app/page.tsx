import Link from "next/link";

export default function Home() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center gap-8">
            <div className="space-y-4 max-w-2xl">
                <h1 className="text-5xl font-bold tracking-tight">
                    Never lose track of what you've lent.
                </h1>
                <p className="text-xl text-text-secondary">
                    Lend to anyone — they don't need an account. BorrowMate makes tracking who has what simple and effortless.
                    Add contacts, lend items, set due dates, and stay organized.
                </p>
            </div>

            <div className="flex gap-4">
                <Link
                    href="/auth"
                    className="bg-primary-500 text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-primary-600 transition-colors"
                >
                    Get Started
                </Link>
                <Link
                    href="/about"
                    className="px-8 py-3 rounded-lg font-medium text-text-secondary hover:bg-surface transition-colors"
                >
                    Learn More
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 text-left max-w-4xl">
                <div className="p-6 bg-surface rounded-xl">
                    <h3 className="font-bold text-lg mb-2">Lend to Anyone</h3>
                    <p className="text-text-secondary">Create contacts for friends and family, then lend items with just a few taps — no signup required.</p>
                </div>
                <div className="p-6 bg-surface rounded-xl">
                    <h3 className="font-bold text-lg mb-2">Stay Organized</h3>
                    <p className="text-text-secondary">View all items you've lent, grouped by contact, with optional due dates to remember when things are due back.</p>
                </div>
                <div className="p-6 bg-surface rounded-xl">
                    <h3 className="font-bold text-lg mb-2">Manage Groups</h3>
                    <p className="text-text-secondary">Share inventory with households or friend groups, organize shared items, and collaborate effortlessly.</p>
                </div>
            </div>
        </div>
    );
}
