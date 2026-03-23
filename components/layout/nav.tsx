'use client'

import Link from 'next/link'
import { WalletButton } from '@/components/wallet/WalletButton'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

export function Nav() {
  return (
    <nav className="sticky top-0 z-50 flex items-center px-4 h-12 border-b border-border-tertiary bg-bg-primary">
      <Link
        href="/"
        className="flex items-center gap-2 font-medium text-sm text-text-primary tracking-tight"
      >
        <span className="w-2 h-2 rounded-full bg-accent flex-shrink-0" />
        teia wiki & multisig test
      </Link>

      <div className="flex-1" />

      <div className="flex items-center gap-3">
        <Link
          href="/wiki"
          className="text-[13px] text-text-secondary hover:text-text-primary transition-colors"
        >
          Wiki
        </Link>
        <Link
          href="/multisig"
          className="text-[13px] text-text-secondary hover:text-text-primary transition-colors"
        >
          Multisig
        </Link>
        <Link
          href="/moderator"
          className="text-[13px] text-text-secondary hover:text-text-primary transition-colors"
        >
          Moderator
        </Link>
        <WalletButton />
        <ThemeToggle />
      </div>
    </nav>
  )
}
