'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import ThemeToggle from './ThemeToggle'
import NotificationBell from './notification-bell'
import { logout } from '@/app/auth/actions'

interface SidebarClientContentProps {
  user: User | null
}

export default function SidebarClientContent({ user }: SidebarClientContentProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/')
  }

  const navItems = user
    ? [
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/items', label: 'My Items' },
        { href: '/contacts', label: 'Contacts' },
        { href: '/groups', label: 'Groups' },
      ]
    : []

  return (
    <>
      {/* Mobile header - appears only on small screens */}
      <div className="fixed top-0 left-0 right-0 z-40 md:hidden flex items-center justify-between p-4 bg-base border-b border-gray-200">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg hover:bg-surface transition-colors"
          aria-label="Toggle sidebar"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            {isOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>

        {/* Mobile notification bell */}
        {user && <NotificationBell />}
      </div>

      {/* Mobile overlay - appears when sidebar is open on small screens */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-base border-r border-gray-200 flex flex-col transition-transform duration-300 z-30 md:z-auto md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        data-testid="sidebar"
      >
        {/* Header/Logo */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <Link
            href={user ? '/dashboard' : '/'}
            className="text-xl font-bold text-primary-600"
            onClick={() => setIsOpen(false)}
          >
            BorrowBase
          </Link>
          {/* Desktop notification bell */}
          {user && <NotificationBell />}
        </div>

        {/* Navigation */}
        {user && (
          <nav className="flex-1 overflow-y-auto px-4 py-6">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`block px-4 py-2 rounded-lg transition-colors ${
                      isActive(item.href)
                        ? 'bg-primary-100 text-primary-700 font-medium'
                        : 'text-text-secondary hover:bg-surface'
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {/* Footer - Theme toggle and User */}
        <div className="border-t border-gray-200 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Theme</span>
            <ThemeToggle />
          </div>

          {user ? (
            <div className="space-y-2">
              <div className="px-4 py-2 rounded-lg bg-surface">
                <p className="text-sm text-text-secondary">Signed in as</p>
                <p className="text-sm font-medium text-text-primary truncate">
                  {user.user_metadata?.name || user.email}
                </p>
              </div>
              <form action={logout} className="w-full">
                <button
                  type="submit"
                  className="w-full px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface rounded-lg transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Sign Out
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/auth"
              className="block w-full px-4 py-2 text-center bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Sign In
            </Link>
          )}
        </div>
      </aside>

      {/* Content offset - prevents content from being hidden behind sidebar on desktop */}
      <div className="hidden md:block h-screen w-64 flex-shrink-0" />
    </>
  )
}
