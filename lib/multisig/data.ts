import {
  MultisigProposal,
  MultisigVote,
  MultisigStorage,
  ProposalKind,
} from './types'
import {
  fetchMultisigStorage,
  fetchMultisigProposals,
  fetchMultisigVotes,
  type MultisigVoteEntry,
} from '@/lib/api/tzkt'
import {
  callAddUserProposal,
  callRemoveUserProposal,
  callTextProposal,
  callTransferMutezProposal,
  callTransferTokenProposal,
  callLambdaFunctionProposal,
  callMinimumVotesProposal,
  callExpirationTimeProposal,
  callVoteProposal,
  callExecuteProposal,
} from '@/lib/contracts/multisig'
import { useWalletStore } from '@/lib/store/walletStore'

// =========================================================================
// Read operations (TzKT bigmaps)
// =========================================================================

export async function getMultisigStorage(): Promise<MultisigStorage> {
  const raw = await fetchMultisigStorage()
  return {
    users: raw.users,
    counter: parseInt(raw.counter, 10),
    minimum_votes: parseInt(raw.minimum_votes, 10),
    expiration_time: parseInt(raw.expiration_time, 10),
  }
}

export async function getMultisigProposals(): Promise<MultisigProposal[]> {
  const raw = await fetchMultisigProposals()
  return raw.map((entry) => mapProposal(parseInt(entry.key, 10), entry.value))
}

export async function getAllMultisigVotes(): Promise<Map<number, MultisigVote[]>> {
  const raw: MultisigVoteEntry[] = await fetchMultisigVotes()
  const map = new Map<number, MultisigVote[]>()
  for (const entry of raw) {
    const pid = parseInt(entry.key.proposal_id, 10)
    const vote: MultisigVote = {
      voter: entry.key.voter,
      proposal_id: pid,
      approval: entry.value,
    }
    const existing = map.get(pid) || []
    existing.push(vote)
    map.set(pid, existing)
  }
  return map
}

export function isProposalExpired(
  proposal: MultisigProposal,
  expirationDays: number
): boolean {
  const created = new Date(proposal.timestamp).getTime()
  const expiresAt = created + expirationDays * 24 * 60 * 60 * 1000
  return Date.now() > expiresAt
}

// =========================================================================
// Write operations (Taquito wallet calls)
// =========================================================================

function getTezos() {
  return useWalletStore.getState().Tezos
}

export async function createAddUserProposal(address: string) {
  return callAddUserProposal(getTezos(), address)
}

export async function createRemoveUserProposal(address: string) {
  return callRemoveUserProposal(getTezos(), address)
}

export async function createTextProposal(text: string) {
  return callTextProposal(getTezos(), text)
}

export async function createTransferMutezProposal(
  transfers: { amount: number; destination: string }[]
) {
  return callTransferMutezProposal(getTezos(), transfers)
}

export async function createTransferTokenProposal(
  fa2Address: string,
  tokenId: number,
  transfers: { amount: number; destination: string }[]
) {
  return callTransferTokenProposal(getTezos(), fa2Address, tokenId, transfers)
}

export async function createLambdaFunctionProposal(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lambda: any
) {
  return callLambdaFunctionProposal(getTezos(), lambda)
}

export async function createMinimumVotesProposal(votes: number) {
  return callMinimumVotesProposal(getTezos(), votes)
}

export async function createExpirationTimeProposal(days: number) {
  return callExpirationTimeProposal(getTezos(), days)
}

export async function voteOnProposal(proposalId: number, approval: boolean) {
  return callVoteProposal(getTezos(), proposalId, approval)
}

export async function executeProposal(proposalId: number) {
  return callExecuteProposal(getTezos(), proposalId)
}

// =========================================================================
// Helpers
// =========================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapProposal(id: number, v: any): MultisigProposal {
  const proposal: MultisigProposal = {
    id,
    kind: (typeof v.kind === 'object' ? Object.keys(v.kind)[0] : v.kind) as ProposalKind,
    issuer: v.issuer,
    timestamp: v.timestamp,
    positive_votes: parseInt(v.positive_votes, 10),
    executed: v.executed,
  }
  if (v.user) proposal.user = v.user
  if (v.text) proposal.text = v.text
  if (v.minimum_votes) proposal.minimum_votes = parseInt(v.minimum_votes, 10)
  if (v.expiration_time)
    proposal.expiration_time = parseInt(v.expiration_time, 10)
  if (v.mutez_transfers) {
    proposal.mutez_transfers = v.mutez_transfers.map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (t: any) => ({
        amount: parseInt(t.amount, 10),
        destination: t.destination,
      })
    )
  }
  if (v.token_transfers) {
    proposal.token_transfers = {
      fa2_address: v.token_transfers.fa2_address,
      token_id: parseInt(v.token_transfers.token_id, 10),
      transfers: v.token_transfers.transfers.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (t: any) => ({
          amount: parseInt(t.amount, 10),
          destination: t.destination,
        })
      ),
    }
  }
  return proposal
}
