'use client'

import Link from 'next/link'
import { useQueryClient } from '@tanstack/react-query'
import { MultisigProposal, MultisigVote } from '@/lib/multisig/types'
import { voteOnProposal, executeProposal, isProposalExpired } from '@/lib/multisig/data'
import { withTransaction } from '@/lib/utils/withTransaction'

function truncateAddress(addr: string) {
  return addr.length > 15 ? `${addr.slice(0, 7)}…${addr.slice(-4)}` : addr
}

function formatKind(kind: string): string {
  return kind.replace(/_/g, ' ')
}

function formatMutez(mutez: number): string {
  return (mutez / 1_000_000).toFixed(6) + ' XTZ'
}

export function ProposalCard({
  proposal,
  votes,
  threshold,
  expirationDays,
  isSigner,
}: {
  proposal: MultisigProposal
  votes: MultisigVote[]
  threshold: number
  expirationDays: number
  isSigner: boolean
}) {
  const queryClient = useQueryClient()

  const expired = isProposalExpired(proposal, expirationDays)
  const canExecute = proposal.positive_votes >= threshold && !proposal.executed && !expired

  const statusLabel = proposal.executed
    ? 'executed'
    : expired
    ? 'expired'
    : 'pending'
  const statusClass = proposal.executed
    ? 'bg-success-bg text-success-text'
    : expired
    ? 'bg-danger-bg text-danger-text'
    : 'bg-warning-bg text-warning-text'

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['multisig'] })
  }

  const handleVote = (approval: boolean) => {
    withTransaction(
      `${approval ? 'Approving' : 'Rejecting'} proposal #${proposal.id}...`,
      () => voteOnProposal(proposal.id, approval),
      invalidate
    )
  }

  const handleExecute = () => {
    withTransaction(
      `Executing proposal #${proposal.id}...`,
      () => executeProposal(proposal.id),
      invalidate
    )
  }

  return (
    <div className="border border-border-tertiary rounded-lg px-4 py-3.5 mb-2.5">
      <div className="flex items-start justify-between gap-2.5 mb-1.5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] bg-bg-secondary text-text-secondary px-1.5 py-0.5 rounded-md">
            #{proposal.id}
          </span>
          <span className="font-medium text-[13px] text-text-primary capitalize">
            {formatKind(proposal.kind)}
          </span>
        </div>
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium flex-shrink-0 ${statusClass}`}
        >
          {statusLabel}
        </span>
      </div>

      {/* Proposal details by kind */}
      <div className="text-[12px] text-text-secondary mb-2 font-mono bg-bg-secondary rounded-md px-3 py-2">
        {proposal.kind === 'add_user' && (
          <span>Add signer: {proposal.user}</span>
        )}
        {proposal.kind === 'remove_user' && (
          <span>Remove signer: {proposal.user}</span>
        )}
        {proposal.kind === 'text' && (
          <span>Text: {proposal.text}</span>
        )}
        {proposal.kind === 'minimum_votes' && (
          <span>Set threshold to: {proposal.minimum_votes}</span>
        )}
        {proposal.kind === 'expiration_time' && (
          <span>Set expiration to: {proposal.expiration_time} days</span>
        )}
        {proposal.kind === 'transfer_mutez' && proposal.mutez_transfers && (
          <div>
            {proposal.mutez_transfers.map((t, i) => (
              <div key={i}>
                {formatMutez(t.amount)} → {truncateAddress(t.destination)}
              </div>
            ))}
          </div>
        )}
        {proposal.kind === 'transfer_token' && proposal.token_transfers && (
          <div>
            <div>Token: {truncateAddress(proposal.token_transfers.fa2_address)} #{proposal.token_transfers.token_id}</div>
            {proposal.token_transfers.transfers.map((t, i) => (
              <div key={i}>
                {t.amount} → {truncateAddress(t.destination)}
              </div>
            ))}
          </div>
        )}
        {proposal.kind === 'lambda_function' && (
          <span>Lambda function</span>
        )}
      </div>

      {/* Meta */}
      <div className="text-[11px] text-text-tertiary mb-1.5">
        <Link href={`/tz/${proposal.issuer}`} className="font-mono hover:underline">{truncateAddress(proposal.issuer)}</Link>
        {' · '}
        {proposal.timestamp}
        {' · '}
        <span className="text-text-secondary font-medium">
          {proposal.positive_votes}/{threshold} votes
        </span>
      </div>

      {/* Votes list */}
      {votes.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {votes.map((v) => (
            <Link
              key={v.voter}
              href={`/tz/${v.voter}`}
              className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono hover:opacity-80 ${
                v.approval
                  ? 'bg-success-bg text-success-text'
                  : 'bg-danger-bg text-danger-text'
              }`}
            >
              {truncateAddress(v.voter)} {v.approval ? '✓' : '✗'}
            </Link>
          ))}
        </div>
      )}

      {/* Actions for signers */}
      {isSigner && !proposal.executed && !expired && (
        <div className="flex gap-1.5 mt-2">
          <button
            onClick={() => handleVote(true)}
            className="text-xs px-3.5 py-1.5 rounded-md bg-accent text-white hover:bg-accent-hover"
          >
            Approve
          </button>
          <button
            onClick={() => handleVote(false)}
            className="text-xs px-2.5 py-1 rounded-md border border-border-secondary text-text-secondary hover:bg-bg-secondary hover:text-text-primary"
          >
            Reject
          </button>
          {canExecute && (
            <button
              onClick={handleExecute}
              className="text-xs px-3.5 py-1.5 rounded-md bg-info-bg text-info-text hover:opacity-80"
            >
              Execute
            </button>
          )}
        </div>
      )}
    </div>
  )
}
