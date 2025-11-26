import Link from "next/link";

export default function Home() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center gap-8">
            <div className="space-y-4 max-w-2xl">
                <h1 className="text-5xl font-bold tracking-tight">
                    Never lose track of shared stuff again.
                </h1>
                <p className="text-xl text-gray-600">
                    BorrowBase helps roommates and friend groups track shared inventory and borrowing.
                    Know who has what, when it's due back, and keep your household organized.
                </p>
            </div>

            <div className="flex gap-4">
                <Link
                    href="/auth"
                    className="bg-foreground text-background px-8 py-3 rounded-lg font-bold text-lg hover:opacity-90 transition-opacity"
                >
                    Get Started
                </Link>
                <Link
                    href="/about" // Placeholder
                    className="px-8 py-3 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                >
                    Learn More
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 text-left max-w-4xl">
                <div className="p-6 bg-gray-50 rounded-xl">
                    <h3 className="font-bold text-lg mb-2">Track Inventory</h3>
                    <p className="text-gray-600">Catalog shared items like tools, games, and kitchen gear in one place.</p>
                </div>
                <div className="p-6 bg-gray-50 rounded-xl">
                    <h3 className="font-bold text-lg mb-2">Log Borrowing</h3>
                    <p className="text-gray-600">Mark items as borrowed and set due dates so everyone knows where things are.</p>
                </div>
                <div className="p-6 bg-gray-50 rounded-xl">
                    <h3 className="font-bold text-lg mb-2">Manage Groups</h3>
                    <p className="text-gray-600">Create multiple groups for your apartment, family, or friend circle.</p>
                </div>
            </div>
        </div>
    );
}
