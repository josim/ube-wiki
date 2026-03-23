import { create } from 'zustand'

interface ToastState {
  message: string | null
  show: (message: string) => void
  clear: () => void
}

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  show: (message: string) => {
    set({ message })
    setTimeout(() => set({ message: null }), 2800)
  },
  clear: () => set({ message: null }),
}))

export function useToast() {
  return useToastStore((s) => s.show)
}
