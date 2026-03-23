import {
  ModeratorProposal,
  ModeratorVote,
  ModeratorStorage,
  ModeratorActionKind,
} from './types'
import {
  fetchModeratorStorage,
  fetchModeratorProposals,
  fetchModeratorVotes,
  fetchModeratorList,
  type ModProposalVotedEvent,
} from '@/lib/api/tzkt'
import {
  callSubmitProposal,
  callVoteProposal,
  callExecuteProposal,
} from '@/lib/contracts/moderator'
import { useWalletStore } from '@/lib/store/walletStore'

// =========================================================================
// Read operations (TzKT events)
// =========================================================================

export async function getModeratorStorage(): Promise<ModeratorStorage> {
  const [raw, moderators] = await Promise.all([
    fetchModeratorStorage(),
    fetchModeratorList(),
  ])
  return {
    moderators,
    multisig_address: raw.multisig_address,
    counter: parseInt(raw.counter, 10),
  }
}

export async function getModeratorProposals(): Promise<ModeratorProposal[]> {
  const raw = await fetchModeratorProposals()
  return raw.map((entry) => mapProposal(entry))
}

export async function getAllModeratorVotes(): Promise<Map<number, ModeratorVote[]>> {
  const raw: ModProposalVotedEvent[] = await fetchModeratorVotes()
  const map = new Map<number, ModeratorVote[]>()

  // Dedupe: keep last vote per (proposal_id, voter)
  const latest = new Map<string, { pid: number; vote: ModeratorVote }>()
  for (const e of raw) {
    const pid = parseInt(e.payload.proposal_id, 10)
    const key = `${pid}:${e.payload.voter}`
    latest.set(key, {
      pid,
      vote: { voter: e.payload.voter, proposal_id: pid, approval: e.payload.approval },
    })
  }

  for (const { pid, vote } of Array.from(latest.values())) {
    const existing = map.get(pid) || []
    existing.push(vote)
    map.set(pid, existing)
  }

  return map
}

export function isProposalExpired(
  proposal: ModeratorProposal,
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

export async function submitAddModeratorProposal(address: string) {
  return callSubmitProposal(getTezos(), { add_moderator: address })
}

export async function submitRemoveModeratorProposal(address: string) {
  return callSubmitProposal(getTezos(), { remove_moderator: address })
}

export async function submitUpdateMultisigProposal(address: string) {
  return callSubmitProposal(getTezos(), { update_multisig_address: address })
}

export async function submitUpdateMetadataProposal(
  key: string,
  value: string
) {
  return callSubmitProposal(getTezos(), {
    update_metadata: { key, value },
  })
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
function mapProposal(raw: any): ModeratorProposal {
  const actionObj = raw.action
  const actionKind = (
    typeof actionObj === 'object' ? Object.keys(actionObj)[0] : actionObj
  ) as ModeratorActionKind

  const proposal: ModeratorProposal = {
    id: parseInt(raw.id, 10),
    action: actionKind,
    issuer: raw.issuer,
    timestamp: raw.timestamp,
    positive_votes: parseInt(raw.positive_votes, 10),
    minimum_votes: 0, // set by caller from multisig storage
    executed: raw.executed,
  }

  // Extract variant-specific data
  if (actionKind === 'add_moderator' && actionObj.add_moderator) {
    proposal.address = actionObj.add_moderator
  }
  if (actionKind === 'remove_moderator' && actionObj.remove_moderator) {
    proposal.address = actionObj.remove_moderator
  }
  if (
    actionKind === 'update_multisig_address' &&
    actionObj.update_multisig_address
  ) {
    proposal.address = actionObj.update_multisig_address
  }
  if (actionKind === 'update_metadata' && actionObj.update_metadata) {
    proposal.metadata_key = actionObj.update_metadata.key
    proposal.metadata_value = actionObj.update_metadata.value
  }

  return proposal
}
