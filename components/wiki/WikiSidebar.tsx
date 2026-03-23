'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { usePageList, usePendingProposalCount } from '@/lib/hooks/queries'
import { useTezos } from '@/lib/hooks/useTezos'
import { canEditPages } from '@/lib/store/walletStore'

export function WikiSidebar() {
  const pathname = usePathname()
  const { role } = useTezos()
  const { data: pages = [] } = usePageList()
  const { data: pendingCount = 0 } = usePendingProposalCount()
  const [open, setOpen] = useState(false)

  // Close sidebar on navigation
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed bottom-4 left-4 z-40 w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center shadow-lg"
        aria-label="Open sidebar"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Backdrop (mobile only) */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <nav className={`
        w-[188px] flex-shrink-0 bg-bg-secondary border-r border-border-tertiary py-3.5 px-2.5
        fixed md:static inset-y-0 left-0 z-50
        transform transition-transform duration-200 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
      `}>
      <span className="block text-[10px] font-medium text-text-tertiary tracking-[0.08em] uppercase px-2 mb-1.5">
        Pages
      </span>
      {pages.map((page) => {
        const href = `/wiki/${page.slug}`
        const isActive = pathname === href
        return (
          <Link
            key={page.slug}
            href={href}
            className={`block w-full text-left px-2.5 py-1.5 rounded-md text-[13px] mb-px transition-colors ${
              isActive
                ? 'bg-bg-primary text-accent font-medium'
                : 'text-text-secondary hover:bg-bg-primary hover:text-text-primary'
            }`}
          >
            {page.title}
          </Link>
        )
      })}

      {canEditPages(role) && (
        <Link
          href="/wiki/new"
          className={`flex items-center gap-1.5 w-full text-left px-2.5 py-1.5 rounded-md text-[13px] mt-1 mb-px transition-colors ${
            pathname === '/wiki/new'
              ? 'bg-bg-primary text-accent font-medium'
              : 'text-accent/70 hover:bg-bg-primary hover:text-accent'
          }`}
        >
          <span className="text-sm leading-none">+</span> New page
        </Link>
      )}

      <span className="block text-[10px] font-medium text-text-tertiary tracking-[0.08em] uppercase px-2 mb-1.5 mt-3.5">
        Community
      </span>
      <Link
        href="/config/wiki-proposals"
        className={`flex items-center justify-between w-full text-left px-2.5 py-1.5 rounded-md text-[13px] mb-px transition-colors ${
          pathname === '/config/wiki-proposals'
            ? 'bg-bg-primary text-accent font-medium'
            : 'text-text-secondary hover:bg-bg-primary hover:text-text-primary'
        }`}
      >
        Page Proposals
        {pendingCount > 0 && (
          <span className="text-[10px] bg-warning-bg text-warning-text px-1.5 py-0.5 rounded-md font-medium">
            {pendingCount}
          </span>
        )}
      </Link>

      <span className="block text-[10px] font-medium text-text-tertiary tracking-[0.08em] uppercase px-2 mb-1.5 mt-3.5">
        Admin
      </span>
      <Link
        href="/multisig"
        className={`block w-full text-left px-2.5 py-1.5 rounded-md text-[13px] mb-px transition-colors ${
          pathname === '/multisig'
            ? 'bg-bg-primary text-accent font-medium'
            : 'text-text-secondary hover:bg-bg-primary hover:text-text-primary'
        }`}
      >
        Multisig
      </Link>
      <Link
        href="/moderator"
        className={`block w-full text-left px-2.5 py-1.5 rounded-md text-[13px] mb-px transition-colors ${
          pathname === '/moderator'
            ? 'bg-bg-primary text-accent font-medium'
            : 'text-text-secondary hover:bg-bg-primary hover:text-text-primary'
        }`}
      >
        Moderator
      </Link>
    </nav>
    </>
  )
}
