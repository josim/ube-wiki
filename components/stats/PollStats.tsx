'use client'

import { usePollStats } from '@/lib/hooks/queries'
import { StatCard } from './StatCard'
import { Leaderboard } from './Leaderboard'
import { TimeSeriesChart } from './TimeSeriesChart'
import { POLL_COMMENTS_CONTRACT_MAINNET, TZKT_EXPLORER_MAINNET } from '@/lib/constants'

const POLL_COLOR = '#1D9E75'

export function PollStatsSection() {
  const { data, isLoading, error } = usePollStats()

  if (isLoading) {
    return <div className="text-[13px] text-text-tertiary">Loading poll comments stats…</div>
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
      <div className="flex items-baseline gap-3 text-[12px] text-text-tertiary">
        <span>Contract:</span>
        <a
          href={`${TZKT_EXPLORER_MAINNET}/${POLL_COMMENTS_CONTRACT_MAINNET}/operations`}
          target="_blank"
          rel="noreferrer"
          className="text-accent hover:underline font-mono"
        >
          {POLL_COMMENTS_CONTRACT_MAINNET}
        </a>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total comments" value={data.totalComments} />
        <StatCard label="Unique polls" value={data.uniquePolls} />
        <StatCard label="Unique commenters" value={data.uniqueCommenters} />
        <StatCard label="Edits" value={data.totalEdits} />
        <StatCard label="Currently hidden" value={data.currentlyHidden} />
        <StatCard
          label="Banned users"
          value={data.governance.bannedCount}
          sublabel="ban-list size"
        />
      </div>

      <TimeSeriesChart
        title="Comments per week"
        data={data.weeklyPosts}
        xKey="week"
        series={[{ key: 'count', label: 'Posts', color: POLL_COLOR }]}
      />

      <div className="grid md:grid-cols-2 gap-4">
        <Leaderboard
          title="Top commenters"
          entries={data.topCommenters}
          countLabel="comments"
        />
        <div className="border border-border-tertiary rounded-lg bg-bg-secondary">
          <div className="px-4 py-2.5 border-b border-border-tertiary text-[11px] text-text-tertiary uppercase tracking-[0.08em] font-medium">
            Top polls
          </div>
          {data.topPolls.length === 0 ? (
            <div className="px-4 py-6 text-[12px] text-text-tertiary">
              No comments yet.
            </div>
          ) : (
            <ol className="divide-y divide-border-tertiary">
              {data.topPolls.map((p, i) => (
                <li
                  key={p.pollId}
                  className="flex items-center gap-3 px-4 py-2"
                >
                  <span className="text-[11px] text-text-tertiary w-5 tabular-nums">
                    {i + 1}.
                  </span>
                  <a
                    href={`https://teia.art/poll/${p.pollId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[13px] text-text-primary hover:text-accent flex-1 min-w-0 truncate"
                  >
                    Poll #{p.pollId}
                  </a>
                  <span className="text-[12px] text-text-secondary tabular-nums flex-shrink-0">
                    {p.count.toLocaleString()}{' '}
                    <span className="text-text-tertiary">comments</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <ModerationCard
          self={data.hideActionsBySender}
          mod={data.hideActionsByModerator}
          currentlyHidden={data.currentlyHidden}
          topModerators={data.governance.topModerators}
        />
        <GovernanceCard
          proposalCounts={data.governance.proposalEventCounts}
          bannedAddresses={data.governance.bannedAddresses}
        />
      </div>
    </div>
  )
}

function ModerationCard({
  self,
  mod,
  currentlyHidden,
  topModerators,
}: {
  self: number
  mod: number
  currentlyHidden: number
  topModerators: { address: string; count: number }[]
}) {
  return (
    <div className="border border-border-tertiary rounded-lg bg-bg-secondary">
      <div className="px-4 py-2.5 border-b border-border-tertiary text-[11px] text-text-tertiary uppercase tracking-[0.08em] font-medium">
        Moderation
      </div>
      <div className="px-4 py-3 grid gap-2 text-[12px]">
        <Row label="Self-hides" value={self} />
        <Row label="Moderator actions" value={mod} />
        <Row label="Currently hidden" value={currentlyHidden} />
      </div>
      {topModerators.length > 0 && (
        <div className="px-4 pb-3">
          <Leaderboard
            title="Top moderators"
            entries={topModerators}
            countLabel="actions"
          />
        </div>
      )}
    </div>
  )
}

function GovernanceCard({
  proposalCounts,
  bannedAddresses,
}: {
  proposalCounts: Record<string, number>
  bannedAddresses: string[]
}) {
  const ordered = Object.entries(proposalCounts).sort((a, b) => b[1] - a[1])
  return (
    <div className="border border-border-tertiary rounded-lg bg-bg-secondary">
      <div className="px-4 py-2.5 border-b border-border-tertiary text-[11px] text-text-tertiary uppercase tracking-[0.08em] font-medium">
        Governance (executed proposals)
      </div>
      <div className="px-4 py-3 grid gap-2 text-[12px]">
        {ordered.map(([action, count]) => (
          <Row key={action} label={action} value={count} mono />
        ))}
      </div>
      {bannedAddresses.length > 0 && (
        <div className="px-4 pb-3 text-[11px] text-text-tertiary">
          {bannedAddresses.length} address{bannedAddresses.length === 1 ? '' : 'es'} currently on
          the ban list.
        </div>
      )}
    </div>
  )
}

function Row({
  label,
  value,
  mono,
}: {
  label: string
  value: number
  mono?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={mono ? 'font-mono text-text-secondary' : 'text-text-secondary'}>
        {label}
      </span>
      <span className="text-text-primary tabular-nums">
        {value.toLocaleString()}
      </span>
    </div>
  )
}
