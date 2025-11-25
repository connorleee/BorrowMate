export default function Home() {
    return (
        <div className="flex flex-col gap-8 items-center justify-center py-12">
            <h1 className="text-4xl font-bold">Welcome to BorrowBase</h1>
            <p className="text-lg text-center max-w-md">
                Track who borrowed what in your household. Simple, clean, and easy.
            </p>
            <div className="flex gap-4">
                <a
                    href="/auth"
                    className="rounded-full bg-foreground text-background px-6 py-2 hover:opacity-90 transition"
                >
                    Get Started
                </a>
                <a
                    href="/dashboard"
                    className="rounded-full border border-foreground/20 px-6 py-2 hover:bg-foreground/5 transition"
                >
                    Dashboard
                </a>
            </div>
        </div>
    );
}
