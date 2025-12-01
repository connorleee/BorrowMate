'use client'

import { useTheme } from '@/context/ThemeContext'

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg hover:bg-surface transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
      aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {resolvedTheme === 'dark' ? (
        // Sun icon
        <svg
          className="w-5 h-5 text-yellow-500"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4.293 1.293a1 1 0 011.414 0l.707.707a1 1 0 11-1.414 1.414l-.707-.707a1 1 0 010-1.414zm2.828 2.829a1 1 0 011.415 0l.707.707a1 1 0 11-1.414 1.414l-.707-.707a1 1 0 011.414-1.414zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm2.121-2.879a1 1 0 011.414 0l.707.707a1 1 0 11-1.414 1.414l-.707-.707a1 1 0 010-1.414zM10 18a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm4.293-.293a1 1 0 011.414 0l.707.707a1 1 0 11-1.414 1.414l-.707-.707a1 1 0 011.414-1.414zm2.828-2.829a1 1 0 011.415 0l.707.707a1 1 0 11-1.414 1.414l-.707-.707a1 1 0 011.414-1.414zM4 11a1 1 0 100-2H3a1 1 0 100 2h1zm-2.121-2.879a1 1 0 011.414 0l.707.707a1 1 0 11-1.414 1.414L1.293 8.12a1 1 0 010-1.414zM10 5a1 1 0 011 1v1a1 1 0 11-2 0V6a1 1 0 011-1zm.293 9.293a1 1 0 011.414 0l.707.707a1 1 0 11-1.414 1.414l-.707-.707a1 1 0 010-1.414zM2.879 2.879a1 1 0 011.414 0l.707.707a1 1 0 11-1.414 1.414L2.879 4.293a1 1 0 010-1.414zM10 10a1 1 0 100-2 1 1 0 000 2z"
            clipRule="evenodd"
          ></path>
        </svg>
      ) : (
        // Moon icon
        <svg
          className="w-5 h-5 text-gray-700"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
        </svg>
      )}
    </button>
  )
}
