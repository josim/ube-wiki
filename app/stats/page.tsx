'use client'

import { useState } from 'react'
import { OverviewSection } from '@/components/stats/Overview'
import { PollStatsSection } from '@/components/stats/PollStats'
import { TokenStatsSection } from '@/components/stats/TokenStats'

type Tab = 'overview' | 'poll' | 'token'

const TABS: { key: Tab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'poll', label: 'Poll Comments' },
  { key: 'token', label: 'Token Comments' },
]

export default function StatsPage() {
  const [tab, setTab] = useState<Tab>('overview')

  return (
    <>
      <div className="px-[22px] pt-[18px] border-b border-border-tertiary flex-shrink-0 bg-bg-primary">
        <div className="flex items-baseline justify-between mb-3">
          <h1 className="text-[17px] font-medium text-text-primary">
            Messaging stats
          </h1>
          <span className="text-[11px] text-text-tertiary">
            mainnet · poll_comments + token_comments
          </span>
        </div>

        <div className="flex">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-[13px] border-b-2 -mb-px transition-colors ${
                tab === t.key
                  ? 'text-accent border-accent font-medium'
                  : 'text-text-secondary border-transparent hover:text-text-primary'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-[22px] max-w-6xl">
        {tab === 'overview' && <OverviewSection />}
        {tab === 'poll' && <PollStatsSection />}
        {tab === 'token' && <TokenStatsSection />}
      </div>
    </>
  )
}
