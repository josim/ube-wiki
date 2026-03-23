import { create } from 'zustand'

type Theme = 'light' | 'dark'

interface ThemeState {
  theme: Theme
  toggle: () => void
  init: () => void
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'light',

  toggle: () => {
    const next = get().theme === 'light' ? 'dark' : 'light'
    set({ theme: next })
    document.documentElement.classList.toggle('dark', next === 'dark')
    localStorage.setItem('theme', next)
  },

  init: () => {
    const stored = localStorage.getItem('theme') as Theme | null
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const theme = stored ?? (prefersDark ? 'dark' : 'light')
    set({ theme })
    document.documentElement.classList.toggle('dark', theme === 'dark')
  },
}))
