'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useModeratorStorage, useModeratorProposals, useAllModeratorVotes, useMultisigStorage, useUserProfiles, getProfileDisplay } from '@/lib/hooks/queries'
import { isProposalExpired } from '@/lib/moderator/data'
import { useTezos } from '@/lib/hooks/useTezos'
import { ProposalCard } from './ProposalCard'
import { CreateProposalForm } from './CreateProposalForm'

type Tab = 'pending' | 'executed' | 'expired'

export function ModeratorPage() {
  const { address } = useTezos()
  const { data: storage } = useModeratorStorage()
  const { data: multisigStorage } = useMultisigStorage()
  const { data: proposals = [] } = useModeratorProposals()
  const { data: allVotes } = useAllModeratorVotes()

  const allAddresses = useMemo(() => {
    const addrs = new Set(storage?.moderators ?? [])
    for (const p of proposals) {
      addrs.add(p.issuer)
      const votes = allVotes?.get(p.id) ?? []
      for (const v of votes) addrs.add(v.voter)
    }
    return Array.from(addrs)
  }, [storage?.moderators, proposals, allVotes])

  const { data: profiles } = useUserProfiles(allAddresses)
  const [showCreate, setShowCreate] = useState(false)
  const [showModerators, setShowModerators] = useState(false)
  const [tab, setTab] = useState<Tab>('pending')

  const isSigner = multisigStorage?.users.includes(address || '') ?? false
  const expirationDays = multisigStorage?.expiration_time ?? 7

  const filtered = proposals.filter((p) => {
    if (tab === 'executed') return p.executed
    if (tab === 'expired') return !p.executed && isProposalExpired(p, expirationDays)
    return !p.executed && !isProposalExpired(p, expirationDays)
  })

  const pendingCount = proposals.filter(
    (p) => !p.executed && !isProposalExpired(p, expirationDays)
  ).length

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'pending', label: 'Pending', count: pendingCount },
    { key: 'executed', label: 'Executed' },
    { key: 'expired', label: 'Expired' },
  ]

  return (
    <>
      <div className="px-[22px] pt-[18px] border-b border-border-tertiary flex-shrink-0 bg-bg-primary">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-[17px] font-medium text-text-primary">
            Moderator
          </h1>
          {isSigner && (
            <button
              onClick={() => setShowCreate(true)}
              className="text-xs px-3.5 py-1.5 rounded-md bg-accent text-white hover:bg-accent-hover"
            >
              + New Proposal
            </button>
          )}
        </div>

        {storage && (
          <div className="flex flex-wrap items-center gap-4 text-[12px] text-text-secondary mb-3.5">
            <button
              onClick={() => setShowModerators(!showModerators)}
              className="text-[12px] text-accent hover:underline"
            >
              {storage.moderators.length} Moderators
            </button>
            <div>
              <span className="text-text-tertiary">Multisig:</span>{' '}
              <Link
                href={`/tz/${storage.multisig_address}`}
                className="font-mono text-text-primary hover:underline"
              >
                {storage.multisig_address.slice(0, 7)}…{storage.multisig_address.slice(-4)}
              </Link>
            </div>
            {multisigStorage && (
              <div>
                <span className="text-text-tertiary">Minimum Votes:</span>{' '}
                <span className="font-medium text-text-primary">
                  {multisigStorage.minimum_votes}/{multisigStorage.users.length}
                </span>
              </div>
            )}
          </div>
        )}

        {showModerators && storage && (
          <div className="mb-3.5 border border-border-tertiary rounded-lg px-4 py-3 bg-bg-secondary">
            <div className="text-[11px] text-text-tertiary uppercase tracking-[0.08em] font-medium mb-2">
              Moderators ({storage.moderators.length})
            </div>
            <div className="grid gap-1.5">
              {storage.moderators.map((addr) => {
                const { name, avatar } = getProfileDisplay(profiles, addr)
                return (
                  <Link
                    key={addr}
                    href={`/tz/${addr}`}
                    className="flex items-center gap-2.5 text-[12px] text-text-secondary hover:text-text-primary"
                  >
                    {avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatar}
                        alt=""
                        className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <span className="w-5 h-5 rounded-full flex-shrink-0 bg-bg-primary border border-border-secondary" />
                    )}
                    <span className="font-mono text-[11px]">
                      {addr.slice(0, 7)}…{addr.slice(-4)}
                    </span>
                    {name && (
                      <span className="text-[12px] font-medium text-text-primary">
                        {name}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        <div className="flex">
          {tabs.map((t) => (
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
              {t.count !== undefined && t.count > 0 && (
                <span className="ml-1.5 text-[10px] bg-warning-bg text-warning-text px-1.5 py-0.5 rounded-md font-medium">
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="p-[22px] overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="text-text-tertiary text-[13px] py-5">
            No {tab} proposals.
          </div>
        ) : (
          filtered.map((p) => (
            <ProposalCard
              key={p.id}
              proposal={p}
              votes={allVotes?.get(p.id) ?? []}
              profiles={profiles}
              threshold={multisigStorage?.minimum_votes ?? 2}
              expirationDays={expirationDays}
              isSigner={isSigner}
            />
          ))
        )}
      </div>

      {/* Create proposal modal */}
      {showCreate && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCreate(false)} />
          <div className="relative bg-bg-primary border border-border-tertiary rounded-lg shadow-lg max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
            <CreateProposalForm onClose={() => setShowCreate(false)} />
          </div>
        </div>
      )}
    </>
  )
}
