import Link from "next/link";

export default function DashboardPage() {
    return (
        <div className="flex flex-col gap-8 w-full">
            {/* Header Section */}
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-gray-500">Welcome back! Here's what's happening.</p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm">
                    <div className="text-sm font-medium text-gray-500">Active Borrows</div>
                    <div className="text-2xl font-bold mt-2">0</div>
                    <div className="text-xs text-gray-400 mt-1">Items you have</div>
                </div>
                <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm">
                    <div className="text-sm font-medium text-gray-500">Items Lent</div>
                    <div className="text-2xl font-bold mt-2">0</div>
                    <div className="text-xs text-gray-400 mt-1">Items with others</div>
                </div>
                <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm">
                    <div className="text-sm font-medium text-gray-500">Total Savings</div>
                    <div className="text-2xl font-bold mt-2">$0</div>
                    <div className="text-xs text-gray-400 mt-1">Estimated value saved</div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                    href="/borrow"
                    className="flex items-center justify-center p-4 rounded-lg bg-foreground text-background font-medium hover:opacity-90 transition-opacity"
                >
                    Borrow an Item
                </Link>
                <Link
                    href="/items"
                    className="flex items-center justify-center p-4 rounded-lg border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                    Add New Item
                </Link>
            </div>

            {/* Recent Activity */}
            <div className="flex flex-col gap-4">
                <h2 className="text-xl font-semibold">Recent Activity</h2>
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                    <div className="p-6 flex flex-col gap-6">
                        {/* Empty State for now */}
                        <div className="flex flex-col items-center justify-center py-8 text-center text-gray-500">
                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                                <span className="text-xl">📋</span>
                            </div>
                            <p className="font-medium">No recent activity</p>
                            <p className="text-sm">When you borrow or lend items, they'll show up here.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
