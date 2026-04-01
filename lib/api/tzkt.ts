import {
  TZKT_API,
  WIKI_CONTRACT,
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

/** Fetch all events with automatic pagination (page size 10,000). */
async function fetchAllEvents<T extends { id: number }>(
  contract: string,
  tag: string,
  extra = ''
): Promise<T[]> {
  const pageSize = 10000
  const all: T[] = []
  let offset = 0

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const page = await fetchEvents<T>(
      contract,
      tag,
      `${extra}&limit=${pageSize}&offset=${offset}&sort.asc=id`
    )
    all.push(...page)
    if (page.length < pageSize) break
    offset += pageSize
  }

  return all
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
  id: number
  payload: {
    slug: string
    cid: string
    editor: string
    timestamp: string
  }
}

interface PageUpdatedEvent {
  id: number
  payload: {
    slug: string
    cid: string
    version: string
    editor: string
    timestamp: string
  }
}

export async function fetchPageSlugs(): Promise<string[]> {
  const events = await fetchAllEvents<PageCreatedEvent>(
    WIKI_CONTRACT,
    'page_created'
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
  const pageSlugParam = `&payload.page_slug=${encodeURIComponent(slug)}`

  const [created, updated, approved] = await Promise.all([
    fetchEvents<PageCreatedEvent>(WIKI_CONTRACT, 'page_created', slugParam),
    fetchEvents<PageUpdatedEvent>(WIKI_CONTRACT, 'page_updated', slugParam),
    fetchEvents<WikiProposalApprovedEvent>(WIKI_CONTRACT, 'proposal_approved', pageSlugParam),
  ])

  if (created.length === 0) return null

  // Merge all events into a single list sorted by TzKT event id (deterministic block-level ordering)
  const versions: { eventId: number; cid: string; editor: string; ts: string }[] = []

  const c = created[0]
  versions.push({ eventId: c.id, cid: c.payload.cid, editor: c.payload.editor, ts: c.payload.timestamp })

  for (const u of updated) {
    versions.push({
      eventId: u.id,
      cid: u.payload.cid,
      editor: u.payload.editor,
      ts: u.payload.timestamp,
    })
  }

  for (const a of approved) {
    versions.push({
      eventId: a.id,
      cid: a.payload.proposed_cid,
      editor: a.payload.approved_by,
      ts: a.payload.timestamp,
    })
  }

  // Sort by event id for deterministic ordering (handles same-block events correctly)
  versions.sort((a, b) => a.eventId - b.eventId)

  const numbered = versions.map((v, i) => ({ ...v, version: String(i + 1) }))
  const currentCid = numbered[numbered.length - 1].cid

  return { cid: currentCid, versions: numbered }
}

// =========================================================================
// Wiki: Proposal reads (via events)
// =========================================================================

interface WikiProposalCreatedEvent {
  id: number
  payload: {
    proposal_id: string
    page_slug: string
    proposed_cid: string
    proposer: string
    timestamp: string
  }
}

interface WikiProposalApprovedEvent {
  id: number
  payload: {
    proposal_id: string
    page_slug: string
    proposed_cid: string
    approved_by: string
    timestamp: string
  }
}

interface WikiProposalRejectedEvent {
  id: number
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
    fetchAllEvents<WikiProposalCreatedEvent>(WIKI_CONTRACT, 'proposal_created'),
    fetchAllEvents<WikiProposalApprovedEvent>(WIKI_CONTRACT, 'proposal_approved'),
    fetchAllEvents<WikiProposalRejectedEvent>(WIKI_CONTRACT, 'proposal_rejected'),
  ])

  const approvedIds = new Set(approved.map((e) => e.payload.proposal_id))
  const rejectedIds = new Set(rejected.map((e) => e.payload.proposal_id))

  return created
    .map((e) => {
      const id = e.payload.proposal_id
      let status = '0'
      if (approvedIds.has(id)) status = '1'
      else if (rejectedIds.has(id)) status = '2'

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
    fetchEvents<WikiProposalCreatedEvent>(WIKI_CONTRACT, 'proposal_created', idParam),
    fetchEvents<WikiProposalApprovedEvent>(WIKI_CONTRACT, 'proposal_approved', idParam),
    fetchEvents<WikiProposalRejectedEvent>(WIKI_CONTRACT, 'proposal_rejected', idParam),
  ])

  if (created.length === 0) return null

  let status = '0'
  if (approved.length > 0) status = '1'
  else if (rejected.length > 0) status = '2'

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
  id: number
  payload: {
    proposal_id: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    action: Record<string, any>
    issuer: string
    timestamp: string
  }
}

export interface ModProposalVotedEvent {
  id: number
  payload: {
    proposal_id: string
    voter: string
    approval: boolean
    positive_votes: string
  }
}

interface ModProposalExecutedEvent {
  id: number
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
    fetchAllEvents<ModProposalSubmittedEvent>(MODERATOR_CONTRACT, 'proposal_submitted'),
    fetchAllEvents<ModProposalVotedEvent>(MODERATOR_CONTRACT, 'proposal_voted'),
    fetchAllEvents<ModProposalExecutedEvent>(MODERATOR_CONTRACT, 'proposal_executed'),
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
  return fetchAllEvents<ModProposalVotedEvent>(
    MODERATOR_CONTRACT,
    'proposal_voted'
  )
}

export async function fetchModeratorList(): Promise<string[]> {
  const [added, removed] = await Promise.all([
    fetchAllEvents<{ id: number; payload: string }>(MODERATOR_CONTRACT, 'moderator_added'),
    fetchAllEvents<{ id: number; payload: string }>(MODERATOR_CONTRACT, 'moderator_removed'),
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
