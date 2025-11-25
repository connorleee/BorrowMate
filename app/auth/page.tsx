export default function AuthPage() {
    return (
        <div className="flex flex-col items-center justify-center gap-4 py-12">
            <h1 className="text-2xl font-bold">Login / Signup</h1>
            <p className="text-gray-500">Auth placeholder</p>
            <form className="flex flex-col gap-4 w-full max-w-sm">
                <input
                    type="email"
                    placeholder="Email"
                    className="p-2 border rounded"
                />
                <input
                    type="password"
                    placeholder="Password"
                    className="p-2 border rounded"
                />
                <button className="bg-foreground text-background p-2 rounded">
                    Sign In
                </button>
            </form>
        </div>
    )
}
