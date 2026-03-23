'use client'

import { useToastStore } from '@/lib/store/toastStore'

export function Toast() {
  const message = useToastStore((s) => s.message)

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 bg-accent text-white px-4 py-2 rounded-md text-xs z-[999] whitespace-nowrap pointer-events-none transition-opacity duration-300 ${
        message ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {message}
    </div>
  )
}
