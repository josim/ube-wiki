'use client'

import { useTokenStats, useTokensMetadata } from '@/lib/hooks/queries'
import { StatCard } from './StatCard'
import { Leaderboard } from './Leaderboard'
import { TimeSeriesChart } from './TimeSeriesChart'
import {
  TOKEN_COMMENTS_CONTRACT_MAINNET,
  TZKT_EXPLORER_MAINNET,
} from '@/lib/constants'

const TOKEN_COLOR = '#1a73e8'

function ipfsToHttp(uri: string): string {
  if (!uri) return ''
  if (uri.startsWith('ipfs://')) {
    return `https://ipfs.io/ipfs/${uri.slice(7)}`
  }
  return uri
}

export function TokenStatsSection() {
  const { data, isLoading, error } = useTokenStats()
  const metaPairs = data?.topTokens.map((t) => ({
    fa2_address: t.fa2_address,
    token_id: t.token_id,
  })) ?? []
  const { data: tokensMeta } = useTokensMetadata(metaPairs)

  if (isLoading) {
    return <div className="text-[13px] text-text-tertiary">Loading token comments stats…</div>
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
          href={`${TZKT_EXPLORER_MAINNET}/${TOKEN_COMMENTS_CONTRACT_MAINNET}/operations`}
          target="_blank"
          rel="noreferrer"
          className="text-accent hover:underline font-mono"
        >
          {TOKEN_COMMENTS_CONTRACT_MAINNET}
        </a>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total comments" value={data.totalComments} />
        <StatCard label="Unique tokens" value={data.uniqueTokens} />
        <StatCard label="FA2 contracts" value={data.uniqueFa2Contracts} />
        <StatCard label="Unique commenters" value={data.uniqueCommenters} />
        <StatCard label="Edits" value={data.totalEdits} />
        <StatCard label="Currently hidden" value={data.currentlyHidden} />
      </div>

      <TimeSeriesChart
        title="Comments per week"
        data={data.weeklyPosts}
        xKey="week"
        series={[{ key: 'count', label: 'Posts', color: TOKEN_COLOR }]}
      />

      <div className="grid md:grid-cols-2 gap-4">
        <Leaderboard
          title="Top commenters"
          entries={data.topCommenters}
          countLabel="comments"
        />

        <div className="border border-border-tertiary rounded-lg bg-bg-secondary">
          <div className="px-4 py-2.5 border-b border-border-tertiary text-[11px] text-text-tertiary uppercase tracking-[0.08em] font-medium">
            Top tokens
          </div>
          {data.topTokens.length === 0 ? (
            <div className="px-4 py-6 text-[12px] text-text-tertiary">
              No comments yet.
            </div>
          ) : (
            <ol className="divide-y divide-border-tertiary">
              {data.topTokens.map((t, i) => {
                const key = `${t.fa2_address}:${t.token_id}`
                const meta = tokensMeta?.get(key)
                const thumb = ipfsToHttp(meta?.thumbnailUri || '')
                const name = meta?.name || `${t.fa2_address.slice(0, 7)}…:${t.token_id}`
                return (
                  <li key={key} className="flex items-center gap-3 px-4 py-2">
                    <span className="text-[11px] text-text-tertiary w-5 tabular-nums">
                      {i + 1}.
                    </span>
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumb}
                        alt=""
                        className="w-7 h-7 rounded object-cover flex-shrink-0 bg-bg-primary"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded bg-bg-primary border border-border-secondary flex-shrink-0" />
                    )}
                    <a
                      href={`${TZKT_EXPLORER_MAINNET}/${t.fa2_address}/tokens/${t.token_id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[13px] text-text-primary hover:text-accent flex-1 min-w-0 truncate"
                      title={`${t.fa2_address}:${t.token_id}`}
                    >
                      {name}
                    </a>
                    <span className="text-[12px] text-text-secondary tabular-nums flex-shrink-0">
                      {t.count.toLocaleString()}{' '}
                      <span className="text-text-tertiary">comments</span>
                    </span>
                  </li>
                )
              })}
            </ol>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="border border-border-tertiary rounded-lg bg-bg-secondary">
          <div className="px-4 py-2.5 border-b border-border-tertiary text-[11px] text-text-tertiary uppercase tracking-[0.08em] font-medium">
            Top FA2 contracts
          </div>
          {data.topFa2Contracts.length === 0 ? (
            <div className="px-4 py-6 text-[12px] text-text-tertiary">
              No comments yet.
            </div>
          ) : (
            <ol className="divide-y divide-border-tertiary">
              {data.topFa2Contracts.map((f, i) => (
                <li
                  key={f.fa2_address}
                  className="flex items-center gap-3 px-4 py-2"
                >
                  <span className="text-[11px] text-text-tertiary w-5 tabular-nums">
                    {i + 1}.
                  </span>
                  <a
                    href={`${TZKT_EXPLORER_MAINNET}/${f.fa2_address}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[13px] text-text-primary hover:text-accent font-mono flex-1 min-w-0 truncate"
                  >
                    {f.fa2_address}
                  </a>
                  <span className="text-[12px] text-text-secondary tabular-nums flex-shrink-0">
                    {f.count.toLocaleString()}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>

        <ModerationCard
          self={data.hideActionsBySender}
          mod={data.hideActionsByModerator}
          currentlyHidden={data.currentlyHidden}
          topModerators={data.governance.topModerators}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
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
