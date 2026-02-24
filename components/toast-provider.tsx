'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'

type ToastType = 'success' | 'error'

interface Toast {
  id: string
  type: ToastType
  message: string
}

interface ToastContextValue {
  addToast: (type: ToastType, message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return ctx
}

const AUTO_DISMISS_MS: Record<ToastType, number> = {
  success: 3000,
  error: 6000,
}

const MAX_TOASTS = 3

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const timer = timersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }
  }, [])

  const addToast = useCallback(
    (type: ToastType, message: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
      setToasts((prev) => {
        const next = [...prev, { id, type, message }]
        // Keep only the most recent MAX_TOASTS
        return next.length > MAX_TOASTS ? next.slice(next.length - MAX_TOASTS) : next
      })

      const timer = setTimeout(() => {
        removeToast(id)
      }, AUTO_DISMISS_MS[type])
      timersRef.current.set(id, timer)
    },
    [removeToast]
  )

  // Cleanup all timers on unmount
  useEffect(() => {
    const timers = timersRef.current
    return () => {
      timers.forEach((timer) => clearTimeout(timer))
      timers.clear()
    }
  }, [])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 items-center pointer-events-none">
            {toasts.map((toast) => (
              <div
                key={toast.id}
                className={`
                  pointer-events-auto
                  flex items-center gap-3 px-4 py-3 rounded-lg border shadow-md
                  min-w-[280px] max-w-[420px]
                  animate-[toast-in_0.25s_ease-out]
                  ${
                    toast.type === 'success'
                      ? 'bg-success-50 text-success-800 border-success-200 dark:bg-success-900 dark:text-success-200 dark:border-success-700'
                      : 'bg-error-50 text-error-800 border-error-200 dark:bg-error-900 dark:text-error-200 dark:border-error-700'
                  }
                `}
                role="alert"
              >
                <span className="flex-shrink-0 text-base">
                  {toast.type === 'success' ? (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="inline-block">
                      <circle cx="9" cy="9" r="9" fill="currentColor" opacity="0.15" />
                      <path d="M5.5 9.5L7.5 11.5L12.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="inline-block">
                      <circle cx="9" cy="9" r="9" fill="currentColor" opacity="0.15" />
                      <path d="M9 5.5V9.5M9 12.5H9.005" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  )}
                </span>
                <span className="flex-1 text-sm font-medium">{toast.message}</span>
                {toast.type === 'error' && (
                  <button
                    onClick={() => removeToast(toast.id)}
                    className="flex-shrink-0 p-0.5 rounded hover:bg-error-100 dark:hover:bg-error-800 transition-colors"
                    aria-label="Dismiss"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  )
}
