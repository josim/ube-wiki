import {
  TZKT_API,
  REGISTRY_CONTRACT,
  PROPOSAL_CONTRACT,
  MULTISIG_CONTRACT,
  MODERATOR_CONTRACT,
} from '@/lib/constants'

// =========================================================================
// Shared primitives
// =========================================================================

async function fetchJson(url: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`TzKT fetch failed: ${res.status} ${url}`)
  return res.json()
}

function eventsUrl(contract: string, tag: string, extra = '') {
  return `${TZKT_API}/contracts/events?contract=${contract}&tag=${tag}${extra}`
}

/** Generic: fetch contract storage. */
export async function fetchStorage<T>(contract: string): Promise<T> {
  return fetchJson(`${TZKT_API}/contracts/${contract}/storage`)
}

/** Generic: fetch events for a contract+tag. */
export async function fetchEvents<T>(
  contract: string,
  tag: string,
  extra = ''
): Promise<T[]> {
  return fetchJson(eventsUrl(contract, tag, extra))
}

/** Generic: fetch bigmap keys for a contract's named bigmap. */
export async function fetchBigmapKeys<T>(
  contract: string,
  bigmapPath: string,
  params = ''
): Promise<T[]> {
  return fetchJson(
    `${TZKT_API}/contracts/${contract}/bigmaps/${bigmapPath}/keys${params ? '?' + params : ''}`
  )
}

// =========================================================================
// Wiki: Registry reads (via events)
// =========================================================================

interface PageCreatedEvent {
  payload: {
    slug: string
    cid: string
    editor: string
    timestamp: string
  }
}

interface PageUpdatedEvent {
  payload: {
    slug: string
    cid: string
    version: string
    editor: string
    timestamp: string
  }
}

export async function fetchPageSlugs(): Promise<string[]> {
  const events = await fetchEvents<PageCreatedEvent>(
    REGISTRY_CONTRACT,
    'page_created',
    '&limit=10000'
  )
  return Array.from(new Set(events.map((e) => e.payload.slug)))
}

export async function fetchPageWithVersions(
  slug: string
): Promise<{
  cid: string
  versions: { cid: string; editor: string; ts: string; version: string }[]
} | null> {
  const slugParam = `&payload.slug=${encodeURIComponent(slug)}`

  const [created, updated] = await Promise.all([
    fetchEvents<PageCreatedEvent>(REGISTRY_CONTRACT, 'page_created', slugParam),
    fetchEvents<PageUpdatedEvent>(REGISTRY_CONTRACT, 'page_updated', slugParam),
  ])

  if (created.length === 0) return null

  const latestUpdate = updated.length > 0
    ? updated.reduce((a, b) =>
        parseInt(a.payload.version, 10) >= parseInt(b.payload.version, 10) ? a : b
      )
    : null
  const currentCid = latestUpdate ? latestUpdate.payload.cid : created[0].payload.cid

  const versions = []
  const c = created[0].payload
  versions.push({ cid: c.cid, editor: c.editor, ts: c.timestamp, version: '1' })

  for (const u of updated) {
    versions.push({
      cid: u.payload.cid,
      editor: u.payload.editor,
      ts: u.payload.timestamp,
      version: u.payload.version,
    })
  }

  return { cid: currentCid, versions }
}

// =========================================================================
// Wiki: Proposal reads (via events)
// =========================================================================

interface WikiProposalCreatedEvent {
  payload: {
    proposal_id: string
    page_slug: string
    proposed_cid: string
    proposer: string
    timestamp: string
  }
}

interface WikiProposalApprovedEvent {
  payload: { proposal_id: string }
}

interface WikiProposalRejectedEvent {
  payload: { proposal_id: string }
}

export async function fetchWikiProposals(): Promise<
  {
    key: string
    value: {
      page_slug: string
      proposed_cid: string
      proposer: string
      status: string
      created_at: string
    }
  }[]
> {
  const [created, approved, rejected] = await Promise.all([
    fetchEvents<WikiProposalCreatedEvent>(PROPOSAL_CONTRACT, 'proposal_created', '&limit=10000'),
    fetchEvents<WikiProposalApprovedEvent>(PROPOSAL_CONTRACT, 'proposal_approved', '&limit=10000'),
    fetchEvents<WikiProposalRejectedEvent>(PROPOSAL_CONTRACT, 'proposal_rejected', '&limit=10000'),
  ])

  const approvedIds = new Set(approved.map((e) => e.payload.proposal_id))
  const rejectedIds = new Set(rejected.map((e) => e.payload.proposal_id))

  return created
    .map((e) => {
      const id = e.payload.proposal_id
      let status = '0'
      if (approvedIds.has(id)) status = '1'
      if (rejectedIds.has(id)) status = '2'

      return {
        key: id,
        value: {
          page_slug: e.payload.page_slug,
          proposed_cid: e.payload.proposed_cid,
          proposer: e.payload.proposer,
          status,
          created_at: e.payload.timestamp,
        },
      }
    })
    .reverse()
}

export async function fetchWikiProposal(id: number): Promise<{
  page_slug: string
  proposed_cid: string
  proposer: string
  status: string
  created_at: string
} | null> {
  const idParam = `&payload.proposal_id=${id}`

  const [created, approved, rejected] = await Promise.all([
    fetchEvents<WikiProposalCreatedEvent>(PROPOSAL_CONTRACT, 'proposal_created', idParam),
    fetchEvents<WikiProposalApprovedEvent>(PROPOSAL_CONTRACT, 'proposal_approved', idParam),
    fetchEvents<WikiProposalRejectedEvent>(PROPOSAL_CONTRACT, 'proposal_rejected', idParam),
  ])

  if (created.length === 0) return null

  let status = '0'
  if (approved.length > 0) status = '1'
  if (rejected.length > 0) status = '2'

  const p = created[0].payload
  return {
    page_slug: p.page_slug,
    proposed_cid: p.proposed_cid,
    proposer: p.proposer,
    status,
    created_at: p.timestamp,
  }
}

// =========================================================================
// Multisig: Storage + bigmap reads
// =========================================================================

export async function fetchMultisigStorage(): Promise<{
  users: string[]
  counter: string
  minimum_votes: string
  expiration_time: string
}> {
  return fetchStorage(MULTISIG_CONTRACT)
}

export interface MultisigProposalEntry {
  key: string
  value: {
    kind: string
    issuer: string
    timestamp: string
    positive_votes: string
    executed: boolean
    user?: string
    text?: string
    minimum_votes?: string
    expiration_time?: string
    mutez_transfers?: { amount: string; destination: string }[]
    token_transfers?: {
      fa2_address: string
      token_id: string
      transfers: { amount: string; destination: string }[]
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lambda_function?: any
  }
  active: boolean
}

export async function fetchMultisigProposals(): Promise<MultisigProposalEntry[]> {
  return fetchBigmapKeys(MULTISIG_CONTRACT, 'proposals', 'active=true&limit=100&sort.desc=id')
}

export interface MultisigVoteEntry {
  key: { proposal_id: string; voter: string }
  value: boolean
}

export async function fetchMultisigVotes(): Promise<MultisigVoteEntry[]> {
  return fetchBigmapKeys(MULTISIG_CONTRACT, 'votes', 'active=true&limit=1000')
}

// =========================================================================
// Moderator: Event-based reads
// =========================================================================

export async function fetchModeratorStorage(): Promise<{
  moderators: string[]
  multisig_address: string
  counter: string
}> {
  return fetchStorage(MODERATOR_CONTRACT)
}

interface ModProposalSubmittedEvent {
  payload: {
    proposal_id: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    action: Record<string, any>
    issuer: string
    timestamp: string
  }
}

export interface ModProposalVotedEvent {
  payload: {
    proposal_id: string
    voter: string
    approval: boolean
    positive_votes: string
  }
}

interface ModProposalExecutedEvent {
  payload: {
    proposal_id: string
    executed_by: string
    timestamp: string
  }
}

export async function fetchModeratorProposals(): Promise<
  {
    id: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    action: Record<string, any>
    issuer: string
    timestamp: string
    positive_votes: string
    executed: boolean
  }[]
> {
  const [submitted, voted, executed] = await Promise.all([
    fetchEvents<ModProposalSubmittedEvent>(MODERATOR_CONTRACT, 'proposal_submitted', '&limit=10000'),
    fetchEvents<ModProposalVotedEvent>(MODERATOR_CONTRACT, 'proposal_voted', '&sort.asc=id&limit=10000'),
    fetchEvents<ModProposalExecutedEvent>(MODERATOR_CONTRACT, 'proposal_executed', '&limit=10000'),
  ])

  const executedIds = new Set(executed.map((e) => e.payload.proposal_id))

  const latestVotes = new Map<string, string>()
  for (const v of voted) {
    latestVotes.set(v.payload.proposal_id, v.payload.positive_votes)
  }

  return submitted
    .map((e) => ({
      id: e.payload.proposal_id,
      action: e.payload.action,
      issuer: e.payload.issuer,
      timestamp: e.payload.timestamp,
      positive_votes: latestVotes.get(e.payload.proposal_id) || '0',
      executed: executedIds.has(e.payload.proposal_id),
    }))
    .reverse()
}

export async function fetchModeratorVotes(): Promise<ModProposalVotedEvent[]> {
  return fetchEvents<ModProposalVotedEvent>(
    MODERATOR_CONTRACT,
    'proposal_voted',
    '&sort.asc=id'
  )
}

export async function fetchModeratorList(): Promise<string[]> {
  const [added, removed] = await Promise.all([
    fetchEvents<{ id: number; payload: string }>(MODERATOR_CONTRACT, 'moderator_added', '&limit=10000'),
    fetchEvents<{ id: number; payload: string }>(MODERATOR_CONTRACT, 'moderator_removed', '&limit=10000'),
  ])

  const events = [
    ...added.map((e) => ({ id: e.id, address: e.payload, type: 'add' as const })),
    ...removed.map((e) => ({ id: e.id, address: e.payload, type: 'remove' as const })),
  ].sort((a, b) => a.id - b.id)

  const moderators = new Set<string>()
  for (const e of events) {
    if (e.type === 'add') moderators.add(e.address)
    else moderators.delete(e.address)
  }

  return Array.from(moderators)
}
