'use client'

import Link from 'next/link'
import { useQueryClient } from '@tanstack/react-query'
import { ModeratorProposal, ModeratorVote } from '@/lib/moderator/types'
import { getProfileDisplay } from '@/lib/hooks/queries'
import { UserProfile } from '@/lib/api/users'
import { voteOnProposal, executeProposal, isProposalExpired } from '@/lib/moderator/data'
import { withTransaction } from '@/lib/utils/withTransaction'
import { truncateAddress } from '@/lib/utils'

function formatAction(action: string): string {
  return action.replace(/_/g, ' ')
}

export function ProposalCard({
  proposal,
  votes,
  profiles,
  threshold,
  expirationDays,
  isSigner,
}: {
  proposal: ModeratorProposal
  votes: ModeratorVote[]
  profiles?: Map<string, UserProfile>
  threshold: number
  expirationDays: number
  isSigner: boolean
}) {
  const queryClient = useQueryClient()

  const expired = isProposalExpired(proposal, expirationDays)
  const canExecute =
    proposal.positive_votes >= threshold && !proposal.executed && !expired

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
    queryClient.invalidateQueries({ queryKey: ['moderator'] })
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

  const issuerProfile = getProfileDisplay(profiles, proposal.issuer)

  return (
    <div className="border border-border-tertiary rounded-lg px-4 py-3.5 mb-2.5">
      <div className="flex items-start justify-between gap-2.5 mb-1.5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] bg-bg-secondary text-text-secondary px-1.5 py-0.5 rounded-md">
            #{proposal.id}
          </span>
          <span className="font-medium text-[13px] text-text-primary capitalize">
            {formatAction(proposal.action)}
          </span>
        </div>
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium flex-shrink-0 ${statusClass}`}
        >
          {statusLabel}
        </span>
      </div>

      {/* Action details */}
      <div className="text-[12px] text-text-secondary mb-2 font-mono bg-bg-secondary rounded-md px-3 py-2">
        {(proposal.action === 'add_moderator' ||
          proposal.action === 'remove_moderator') && proposal.address && (
          <span>
            {proposal.action === 'add_moderator' ? 'Add' : 'Remove'} moderator:{' '}
            <Link href={`/tz/${proposal.address}`} className="hover:underline">
              {getProfileDisplay(profiles, proposal.address).name || proposal.address}
            </Link>
          </span>
        )}
        {proposal.action === 'update_multisig_address' && (
          <span>New multisig address: {proposal.address}</span>
        )}
        {proposal.action === 'update_metadata' && (
          <span>
            Metadata: {proposal.metadata_key} = {proposal.metadata_value}
          </span>
        )}
      </div>

      {/* Meta */}
      <div className="text-[11px] text-text-tertiary mb-1.5 flex items-center gap-1">
        <Link
          href={`/tz/${proposal.issuer}`}
          className={`hover:underline ${issuerProfile.name ? 'text-text-secondary font-medium' : 'font-mono'}`}
        >
          {issuerProfile.name || truncateAddress(proposal.issuer)}
        </Link>
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
          {votes.map((v) => {
            const voterProfile = getProfileDisplay(profiles, v.voter)
            return (
              <Link
                key={v.voter}
                href={`/tz/${v.voter}`}
                className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md hover:opacity-80 ${
                  v.approval
                    ? 'bg-success-bg text-success-text'
                    : 'bg-danger-bg text-danger-text'
                }`}
              >
                {voterProfile.avatar && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={voterProfile.avatar}
                    alt=""
                    className="w-3.5 h-3.5 rounded-full object-cover"
                  />
                )}
                <span className="font-mono">
                  {voterProfile.name || truncateAddress(v.voter)}
                </span>
                {v.approval ? ' ✓' : ' ✗'}
              </Link>
            )
          })}
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
