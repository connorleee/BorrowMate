import Link from "next/link";

export default function AboutPage() {
    return (
        <div className="flex flex-col gap-16 w-full max-w-4xl mx-auto py-8">
            <div className="text-center space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                    Never lose track of shared stuff again
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                    BorrowMate helps roommates and friend groups track shared inventory and borrowing.
                    Know who has what, when it's due back, and keep your household organized.
                </p>
            </div>

            <section className="space-y-6">
                <h2 className="text-3xl font-bold">The Problem</h2>
                <div className="prose prose-lg">
                    <p className="text-gray-600">
                        Roommates and friend groups constantly lose track of:
                    </p>
                    <ul className="text-gray-600 space-y-2">
                        <li>Who owns which items (tools, games, kitchen gear, etc.)</li>
                        <li>Who borrowed what and when it's coming back</li>
                        <li>Shared vs personal items</li>
                        <li>Household inventory during move-in/move-out</li>
                    </ul>
                    <p className="text-gray-600">
                        Existing roommate apps focus on <strong>bills and chores</strong>, not <strong>stuff</strong>.
                        BorrowMate fills that gap.
                    </p>
                </div>
            </section>

            <section className="space-y-8">
                <h2 className="text-3xl font-bold">Key Features</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </div>
                        <h3 className="font-bold text-xl mb-2">Track Inventory</h3>
                        <p className="text-gray-700">
                            Catalog shared items like tools, games, and kitchen gear in one place.
                            Mark items as personal or shared with your group.
                        </p>
                    </div>

                    <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                        <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                        </div>
                        <h3 className="font-bold text-xl mb-2">Log Borrowing</h3>
                        <p className="text-gray-700">
                            Mark items as borrowed and set due dates. See at a glance who has what
                            and when things are coming back.
                        </p>
                    </div>

                    <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                        <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <h3 className="font-bold text-xl mb-2">Manage Groups</h3>
                        <p className="text-gray-700">
                            Create multiple groups for your apartment, family, or friend circle.
                            Invite members with shareable links.
                        </p>
                    </div>

                    <div className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200">
                        <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        </div>
                        <h3 className="font-bold text-xl mb-2">Privacy Controls</h3>
                        <p className="text-gray-700">
                            Control who sees what. Keep personal items private or share them with your groups.
                            Make groups public or private.
                        </p>
                    </div>
                </div>
            </section>

            <section className="space-y-6">
                <h2 className="text-3xl font-bold">Who is BorrowMate for?</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-6 bg-gray-50 rounded-xl text-center">
                        <div className="text-4xl mb-3">🏠</div>
                        <h3 className="font-bold mb-2">Roommates</h3>
                        <p className="text-sm text-gray-600">
                            Keep track of household items and avoid those awkward "have you seen my..." conversations
                        </p>
                    </div>
                    <div className="p-6 bg-gray-50 rounded-xl text-center">
                        <div className="text-4xl mb-3">💑</div>
                        <h3 className="font-bold mb-2">Couples</h3>
                        <p className="text-sm text-gray-600">
                            Managing a shared household is easier when you know where everything is
                        </p>
                    </div>
                    <div className="p-6 bg-gray-50 rounded-xl text-center">
                        <div className="text-4xl mb-3">🎮</div>
                        <h3 className="font-bold mb-2">Friend Groups</h3>
                        <p className="text-sm text-gray-600">
                            Board games, tools, camping gear - never lose track of lent items again
                        </p>
                    </div>
                </div>
            </section>

            <section className="space-y-6 bg-gradient-to-r from-blue-50 to-purple-50 p-8 rounded-2xl border border-blue-200">
                <h2 className="text-3xl font-bold">How It Works</h2>
                <div className="space-y-4">
                    <div className="flex gap-4 items-start">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                            1
                        </div>
                        <div>
                            <h4 className="font-bold mb-1">Create or Join a Group</h4>
                            <p className="text-gray-600">
                                Start a group for your household or join an existing one with an invite link.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-4 items-start">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                            2
                        </div>
                        <div>
                            <h4 className="font-bold mb-1">Add Your Items</h4>
                            <p className="text-gray-600">
                                Catalog items you own and choose whether to share them with the group or keep them personal.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-4 items-start">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                            3
                        </div>
                        <div>
                            <h4 className="font-bold mb-1">Track Borrowing</h4>
                            <p className="text-gray-600">
                                When someone borrows an item, log it with an optional due date. Mark it returned when it comes back.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-4 items-start">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                            4
                        </div>
                        <div>
                            <h4 className="font-bold mb-1">Stay Organized</h4>
                            <p className="text-gray-600">
                                View your dashboard to see what you're borrowing, what you've lent out, and your full inventory.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <div className="text-center space-y-4 py-8">
                <h2 className="text-3xl font-bold">Ready to get organized?</h2>
                <p className="text-gray-600 mb-6">
                    Join BorrowMate today and never lose track of your stuff again.
                </p>
                <Link
                    href="/auth"
                    className="inline-block bg-foreground text-background px-8 py-3 rounded-lg font-bold text-lg hover:opacity-90 transition-opacity"
                >
                    Get Started for Free
                </Link>
            </div>
        </div>
    );
}
