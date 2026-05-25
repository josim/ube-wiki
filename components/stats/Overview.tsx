'use client'

import { useOverviewStats } from '@/lib/hooks/queries'
import { StatCard } from './StatCard'
import { TimeSeriesChart } from './TimeSeriesChart'

const POLL_COLOR = '#1D9E75'
const TOKEN_COLOR = '#1a73e8'

export function OverviewSection() {
  const { data, isLoading, error } = useOverviewStats()

  if (isLoading) {
    return (
      <div className="text-[13px] text-text-tertiary">Loading mainnet stats…</div>
    )
  }
  if (error || !data) {
    return (
      <div className="text-[13px] text-text-tertiary">
        Couldn&apos;t load stats: {String(error)}
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard label="Poll comments" value={data.pollComments} />
        <StatCard label="Token comments" value={data.tokenComments} />
        <StatCard
          label="Unique commenters"
          value={data.totalUniqueCommenters}
          sublabel="union across both contracts"
        />
        <StatCard label="Total edits" value={data.totalEdits} />
        <StatCard
          label="Hide actions"
          value={data.totalHides}
          sublabel="self + moderator"
        />
      </div>

      <TimeSeriesChart
        title="Comments per week — both contracts"
        data={data.weeklyPosts}
        xKey="week"
        height={240}
        series={[
          { key: 'poll', label: 'Poll comments', color: POLL_COLOR },
          { key: 'token', label: 'Token comments', color: TOKEN_COLOR },
        ]}
      />
    </div>
  )
}
