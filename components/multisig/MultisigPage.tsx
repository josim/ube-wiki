'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useMultisigStorage, useMultisigProposals, useAllMultisigVotes, useUserProfiles, getProfileDisplay } from '@/lib/hooks/queries'
import { isProposalExpired } from '@/lib/multisig/data'
import { useTezos } from '@/lib/hooks/useTezos'
import { ProposalCard } from './ProposalCard'
import { CreateProposalForm } from './CreateProposalForm'

type Tab = 'pending' | 'executed' | 'expired'

export function MultisigPage() {
  const { address } = useTezos()
  const { data: storage } = useMultisigStorage()
  const { data: proposals = [] } = useMultisigProposals()
  const { data: allVotes } = useAllMultisigVotes()
  const [showCreate, setShowCreate] = useState(false)
  const [showSigners, setShowSigners] = useState(false)
  const [tab, setTab] = useState<Tab>('pending')

  // Signers + proposal issuers, targets, and voters
  const profileAddresses = useMemo(() => {
    const addrs = new Set(storage?.users ?? [])
    for (const p of proposals) {
      addrs.add(p.issuer)
      if (p.user) addrs.add(p.user)
    }
    if (allVotes) {
      for (const votes of Array.from(allVotes.values())) {
        for (const v of votes) addrs.add(v.voter)
      }
    }
    return Array.from(addrs)
  }, [storage?.users, proposals, allVotes])
  const { data: profiles } = useUserProfiles(profileAddresses)
  const isSigner = storage?.users.includes(address || '') ?? false
  const expirationDays = storage?.expiration_time ?? 7

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
            Multisig
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
              onClick={() => setShowSigners(!showSigners)}
              className="text-[12px] text-accent hover:underline"
            >
              {storage.users.length} Signers
            </button>
            <div>
              <span className="text-text-tertiary">Minimum Votes:</span>{' '}
              <span className="font-medium text-text-primary">
                {storage.minimum_votes}/{storage.users.length}
              </span>
            </div>
            <div>
              <span className="text-text-tertiary">Expiration:</span>{' '}
              <span className="font-medium text-text-primary">
                {storage.expiration_time} days
              </span>
            </div>
          </div>
        )}

        {showSigners && storage && (
          <div className="mb-3.5 border border-border-tertiary rounded-lg px-4 py-3 bg-bg-secondary">
            <div className="text-[11px] text-text-tertiary uppercase tracking-[0.08em] font-medium mb-2">
              Signers ({storage.users.length})
            </div>
            <div className="grid gap-1.5">
              {storage.users.map((addr) => {
                const { name, avatar } = getProfileDisplay(profiles, addr)
                const isYou = addr === address
                return (
                  <div
                    key={addr}
                    className="flex items-center gap-2.5 text-[12px] text-text-secondary"
                  >
                    {avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatar}
                        alt=""
                        className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <span className={`w-5 h-5 rounded-full flex-shrink-0 bg-bg-primary border border-border-secondary ${
                        isYou ? 'border-accent' : ''
                      }`} />
                    )}
                    <Link
                      href={`/tz/${addr}`}
                      className={`hover:underline ${
                        name
                          ? `text-[12px] font-medium ${isYou ? 'text-accent' : 'text-text-primary'}`
                          : `font-mono text-[11px] ${isYou ? 'text-accent' : ''}`
                      }`}
                    >
                      {name || `${addr.slice(0, 7)}…${addr.slice(-4)}`}
                    </Link>
                    {isYou && (
                      <span className="text-[10px] text-accent">(you)</span>
                    )}
                  </div>
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
              threshold={storage?.minimum_votes ?? 2}
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
