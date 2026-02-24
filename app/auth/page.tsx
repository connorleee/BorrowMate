'use client'

import { useState } from 'react'
import { login, signup, signInWithGoogle } from './actions'


export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setError(null)
        try {
            const email = formData.get('email') as string
            const password = formData.get('password') as string

            if (isLogin) {
                const result = await login({ email, password })
                if (result?.serverError) {
                    setError(result.serverError)
                }
            } else {
                const name = formData.get('name') as string
                const result = await signup({ name, email, password })
                if (result?.serverError) {
                    setError(result.serverError)
                }
            }
        } catch (e) {
            setError('An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    async function handleGoogleSignIn() {
        try {
            await signInWithGoogle({})
        } catch (e) {
            setError('An unexpected error occurred')
        }
    }

    return (
        <div className="flex flex-col items-center justify-center gap-6 py-12 w-full max-w-md mx-auto">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold">{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
                <p className="text-[var(--text-secondary)]">
                    {isLogin ? 'Sign in to manage your shared items' : 'Join BorrowBase to track your stuff'}
                </p>
            </div>

            <form action={handleSubmit} className="flex flex-col gap-4 w-full">
                {!isLogin && (
                    <div className="flex flex-col gap-2">
                        <label htmlFor="name" className="text-sm font-medium">Name</label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            placeholder="Your Name"
                            required
                            className="p-3 border border-[var(--border)] rounded-lg bg-[var(--bg-base)] text-[var(--text-primary)]"
                        />
                    </div>
                )}

                <div className="flex flex-col gap-2">
                    <label htmlFor="email" className="text-sm font-medium">Email</label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        required
                        className="p-3 border border-[var(--border)] rounded-lg bg-[var(--bg-base)] text-[var(--text-primary)]"
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label htmlFor="password" className="text-sm font-medium">Password</label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        required
                        minLength={6}
                        className="p-3 border border-[var(--border)] rounded-lg bg-[var(--bg-base)] text-[var(--text-primary)]"
                    />
                </div>

                {error && (
                    <div className="p-3 text-sm text-error-500 bg-error-50 rounded-lg border border-error-200">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="bg-primary-500 text-white p-3 rounded-lg font-medium hover:bg-primary-600 transition-colors disabled:opacity-50"
                >
                    {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
                </button>
            </form>

            <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[var(--border)]" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="px-4 bg-[var(--bg-base)] text-[var(--text-secondary)]">
                        Or continue with
                    </span>
                </div>
            </div>

            <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full p-3 border border-[var(--border)] rounded-lg flex items-center justify-center gap-2 hover:bg-[var(--bg-surface)] transition-colors"
            >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                    />
                    <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                    />
                    <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                    />
                    <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                    />
                </svg>
                Google
            </button>

            <div className="text-sm text-[var(--text-secondary)]">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button
                    onClick={() => {
                        setIsLogin(!isLogin)
                        setError(null)
                    }}
                    className="text-primary-600 font-medium hover:underline"
                >
                    {isLogin ? 'Sign Up' : 'Sign In'}
                </button>
            </div>
        </div>
    )
}
