'use client'

import Link from 'next/link'
import { usePendingProposalCount } from '@/lib/hooks/queries'

const configItems = [
  {
    title: 'Wiki Proposals',
    description: 'Review, approve, or reject community-submitted wiki changes',
    href: '/config/wiki-proposals',
    showBadge: true,
  },
]

export default function ConfigPage() {
  const { data: pendingCount = 0 } = usePendingProposalCount()

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-[20px] font-semibold text-text-primary mb-1.5">
        Config
      </h1>
      <p className="text-[13px] text-text-tertiary mb-6">
        DAO tools and administration.
      </p>

      <div className="grid gap-3">
        {configItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center justify-between border border-border-tertiary rounded-lg px-5 py-4 hover:bg-bg-secondary transition-colors"
          >
            <div>
              <span className="text-[14px] font-medium text-text-primary">
                {item.title}
              </span>
              <p className="text-[12px] text-text-tertiary mt-0.5">
                {item.description}
              </p>
            </div>
            {item.showBadge && pendingCount > 0 && (
              <span className="text-[10px] bg-warning-bg text-warning-text px-2 py-0.5 rounded-md font-medium">
                {pendingCount} pending
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}
