'use client'

import Link from 'next/link'
import { useUserProfiles, getProfileDisplay } from '@/lib/hooks/queries'

interface LeaderboardProps {
  title: string
  entries: { address: string; count: number }[]
  countLabel?: string
  emptyHint?: string
}

export function Leaderboard({
  title,
  entries,
  countLabel = 'comments',
  emptyHint = 'No activity yet.',
}: LeaderboardProps) {
  const addresses = entries.map((e) => e.address)
  const { data: profiles } = useUserProfiles(addresses)

  return (
    <div className="border border-border-tertiary rounded-lg bg-bg-secondary">
      <div className="px-4 py-2.5 border-b border-border-tertiary text-[11px] text-text-tertiary uppercase tracking-[0.08em] font-medium">
        {title}
      </div>
      {entries.length === 0 ? (
        <div className="px-4 py-6 text-[12px] text-text-tertiary">{emptyHint}</div>
      ) : (
        <ol className="divide-y divide-border-tertiary">
          {entries.map((e, i) => {
            const { name, avatar } = getProfileDisplay(profiles, e.address)
            const short = `${e.address.slice(0, 7)}…${e.address.slice(-4)}`
            const label = name || short
            return (
              <li
                key={e.address}
                className="flex items-center gap-3 px-4 py-2"
              >
                <span className="text-[11px] text-text-tertiary w-5 tabular-nums">
                  {i + 1}.
                </span>
                {avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatar}
                    alt=""
                    className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-bg-primary border border-border-secondary flex-shrink-0" />
                )}
                <Link
                  href={`/tz/${e.address}`}
                  className="text-[13px] text-text-primary hover:text-accent truncate flex-1 min-w-0"
                  title={e.address}
                >
                  {label}
                </Link>
                <span className="text-[12px] text-text-secondary tabular-nums flex-shrink-0">
                  {e.count.toLocaleString()}{' '}
                  <span className="text-text-tertiary">{countLabel}</span>
                </span>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
