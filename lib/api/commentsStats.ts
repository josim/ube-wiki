import {
  POLL_COMMENTS_CONTRACT_MAINNET,
  TOKEN_COMMENTS_CONTRACT_MAINNET,
} from '@/lib/constants'
import { fetchAllEventsMainnet } from './tzkt-mainnet'

// ============================================================================
// Event payload types — match the contracts' emitted events 1:1
// ============================================================================

interface PollCommentPostedEvent {
  id: number
  payload: {
    poll_id: string
    comment_id: string
    sender: string
    parent_id?: string | null
    timestamp: string
  }
}

interface PollCommentEditedEvent {
  id: number
  payload: {
    poll_id: string
    comment_id: string
    sender: string
    parent_id?: string | null
    timestamp: string
    version: string
  }
}

interface CommentHiddenSetEvent {
  id: number
  payload: {
    comment_id: string
    hidden: boolean
    updated_by: string
  }
}

interface CommentModeratedEvent {
  id: number
  payload: {
    comment_id: string
    hidden: boolean
    moderator: string
  }
}

interface TokenCommentPostedEvent {
  id: number
  payload: {
    fa2_address: string
    token_id: string
    comment_id: string
    sender: string
    parent_id?: string | null
    timestamp: string
  }
}

interface TokenCommentEditedEvent {
  id: number
  payload: {
    fa2_address: string
    token_id: string
    comment_id: string
    sender: string
    parent_id?: string | null
    timestamp: string
    version: string
  }
}

interface UserBannedSetEvent {
  id: number
  payload: {
    proposal_id: string
    address: string
    banned: boolean
    updated_by: string
  }
}

interface PauseSetEvent {
  id: number
  payload: { proposal_id: string; paused: boolean; updated_by: string }
}

interface FeeSetEvent {
  id: number
  payload: { proposal_id: string; updated_by: string } & Record<string, unknown>
}

// ============================================================================
// Shared stats shapes
// ============================================================================

export interface TimeBucket {
  /** ISO-8601 week-start (Monday) in UTC, e.g. 2025-12-29. */
  week: string
  count: number
}

export interface AddressCount {
  address: string
  count: number
}

export interface GovernanceSummary {
  bannedCount: number
  bannedAddresses: string[]
  proposalEventCounts: Record<string, number>
  topModerators: AddressCount[]
}

export interface PollStats {
  totalComments: number
  totalEdits: number
  uniquePolls: number
  uniqueCommenters: number
  currentlyHidden: number
  hideActionsBySender: number
  hideActionsByModerator: number
  topPolls: { pollId: string; count: number }[]
  topCommenters: AddressCount[]
  weeklyPosts: TimeBucket[]
  governance: GovernanceSummary
}

export interface TokenStats {
  totalComments: number
  totalEdits: number
  uniqueTokens: number
  uniqueFa2Contracts: number
  uniqueCommenters: number
  currentlyHidden: number
  hideActionsBySender: number
  hideActionsByModerator: number
  topTokens: { fa2_address: string; token_id: string; count: number }[]
  topFa2Contracts: { fa2_address: string; count: number }[]
  topCommenters: AddressCount[]
  weeklyPosts: TimeBucket[]
  governance: GovernanceSummary
}

export interface OverviewStats {
  pollComments: number
  tokenComments: number
  totalUniqueCommenters: number
  totalEdits: number
  totalHides: number
  weeklyPosts: { week: string; poll: number; token: number }[]
}

// ============================================================================
// Helpers
// ============================================================================

function weekStartISO(timestamp: string): string {
  const d = new Date(timestamp)
  // Snap to Monday (UTC). getUTCDay: 0=Sun..6=Sat → offset to previous Monday.
  const day = d.getUTCDay()
  const offset = (day + 6) % 7
  const monday = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - offset)
  )
  return monday.toISOString().slice(0, 10)
}

function topN<T>(
  items: T[],
  keyFn: (t: T) => string,
  n: number
): { key: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const item of items) {
    const k = keyFn(item)
    counts.set(k, (counts.get(k) ?? 0) + 1)
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([key, count]) => ({ key, count }))
}

function countBy<T>(items: T[], keyFn: (t: T) => string): Map<string, number> {
  const out = new Map<string, number>()
  for (const item of items) {
    const k = keyFn(item)
    out.set(k, (out.get(k) ?? 0) + 1)
  }
  return out
}

/** Fold hide events into a current-hidden-count: each comment is hidden iff the latest
 *  hide-flip (by event id, across self-hide and moderator-hide) left it hidden. */
function computeCurrentlyHidden(
  hiddenSet: { id: number; payload: { comment_id: string; hidden: boolean } }[],
  moderated: { id: number; payload: { comment_id: string; hidden: boolean } }[]
): number {
  const merged = [
    ...hiddenSet.map((e) => ({
      id: e.id,
      comment_id: e.payload.comment_id,
      hidden: e.payload.hidden,
    })),
    ...moderated.map((e) => ({
      id: e.id,
      comment_id: e.payload.comment_id,
      hidden: e.payload.hidden,
    })),
  ].sort((a, b) => a.id - b.id)

  const state = new Map<string, boolean>()
  for (const e of merged) state.set(e.comment_id, e.hidden)
  return Array.from(state.values()).filter(Boolean).length
}

function bucketWeeks(timestamps: string[]): TimeBucket[] {
  const buckets = new Map<string, number>()
  for (const ts of timestamps) {
    const w = weekStartISO(ts)
    buckets.set(w, (buckets.get(w) ?? 0) + 1)
  }
  return Array.from(buckets.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([week, count]) => ({ week, count }))
}

/** Final ban-list state by replaying user_banned_set events in id order. */
function computeBannedSet(events: UserBannedSetEvent[]): Set<string> {
  const sorted = [...events].sort((a, b) => a.id - b.id)
  const out = new Set<string>()
  for (const e of sorted) {
    if (e.payload.banned) out.add(e.payload.address)
    else out.delete(e.payload.address)
  }
  return out
}

// ============================================================================
// Poll Comments stats
// ============================================================================

export async function getPollStats(): Promise<PollStats> {
  const c = POLL_COMMENTS_CONTRACT_MAINNET
  const [
    posted,
    edited,
    hiddenSet,
    moderated,
    banned,
    pauseSet,
    postFeeSet,
    editFeeSet,
    hideFeeSet,
    tokenGateUpdated,
  ] = await Promise.all([
    fetchAllEventsMainnet<PollCommentPostedEvent>(c, 'comment_posted'),
    fetchAllEventsMainnet<PollCommentEditedEvent>(c, 'comment_edited'),
    fetchAllEventsMainnet<CommentHiddenSetEvent>(c, 'comment_hidden_set'),
    fetchAllEventsMainnet<CommentModeratedEvent>(c, 'comment_moderated'),
    fetchAllEventsMainnet<UserBannedSetEvent>(c, 'user_banned_set'),
    fetchAllEventsMainnet<PauseSetEvent>(c, 'pause_set'),
    fetchAllEventsMainnet<FeeSetEvent>(c, 'post_fee_set'),
    fetchAllEventsMainnet<FeeSetEvent>(c, 'edit_fee_set'),
    fetchAllEventsMainnet<FeeSetEvent>(c, 'hide_fee_set'),
    fetchAllEventsMainnet<FeeSetEvent>(c, 'token_gate_updated'),
  ])

  const senders = posted.map((e) => e.payload.sender)
  const polls = posted.map((e) => e.payload.poll_id)
  const bannedSet = computeBannedSet(banned)

  const topModerators = topN(moderated, (e) => e.payload.moderator, 5).map(
    ({ key, count }) => ({ address: key, count })
  )

  return {
    totalComments: posted.length,
    totalEdits: edited.length,
    uniquePolls: new Set(polls).size,
    uniqueCommenters: new Set(senders).size,
    currentlyHidden: computeCurrentlyHidden(hiddenSet, moderated),
    hideActionsBySender: hiddenSet.length,
    hideActionsByModerator: moderated.length,
    topPolls: topN(posted, (e) => e.payload.poll_id, 10).map(({ key, count }) => ({
      pollId: key,
      count,
    })),
    topCommenters: topN(posted, (e) => e.payload.sender, 10).map(
      ({ key, count }) => ({ address: key, count })
    ),
    weeklyPosts: bucketWeeks(posted.map((e) => e.payload.timestamp)),
    governance: {
      bannedCount: bannedSet.size,
      bannedAddresses: Array.from(bannedSet),
      proposalEventCounts: {
        pause_set: pauseSet.length,
        post_fee_set: postFeeSet.length,
        edit_fee_set: editFeeSet.length,
        hide_fee_set: hideFeeSet.length,
        token_gate_updated: tokenGateUpdated.length,
        user_banned_set: banned.length,
      },
      topModerators,
    },
  }
}

// ============================================================================
// Token Comments stats
// ============================================================================

export async function getTokenStats(): Promise<TokenStats> {
  const c = TOKEN_COMMENTS_CONTRACT_MAINNET
  const [
    posted,
    edited,
    hiddenSet,
    moderated,
    banned,
    pauseSet,
    postFeeSet,
    editFeeSet,
    hideFeeSet,
  ] = await Promise.all([
    fetchAllEventsMainnet<TokenCommentPostedEvent>(c, 'comment_posted'),
    fetchAllEventsMainnet<TokenCommentEditedEvent>(c, 'comment_edited'),
    fetchAllEventsMainnet<CommentHiddenSetEvent>(c, 'comment_hidden_set'),
    fetchAllEventsMainnet<CommentModeratedEvent>(c, 'comment_moderated'),
    fetchAllEventsMainnet<UserBannedSetEvent>(c, 'user_banned_set'),
    fetchAllEventsMainnet<PauseSetEvent>(c, 'pause_set'),
    fetchAllEventsMainnet<FeeSetEvent>(c, 'post_fee_set'),
    fetchAllEventsMainnet<FeeSetEvent>(c, 'edit_fee_set'),
    fetchAllEventsMainnet<FeeSetEvent>(c, 'hide_fee_set'),
  ])

  const bannedSet = computeBannedSet(banned)
  const senders = posted.map((e) => e.payload.sender)

  const tokenKeyOf = (e: TokenCommentPostedEvent) =>
    `${e.payload.fa2_address}:${e.payload.token_id}`

  const fa2Counts = countBy(posted, (e) => e.payload.fa2_address)
  const tokenIds = new Set(posted.map(tokenKeyOf))

  const topTokensRaw = topN(posted, tokenKeyOf, 10)
  const topTokens = topTokensRaw.map(({ key, count }) => {
    const [fa2_address, token_id] = key.split(':')
    return { fa2_address, token_id, count }
  })

  const topFa2Contracts = Array.from(fa2Counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([fa2_address, count]) => ({ fa2_address, count }))

  const topModerators = topN(moderated, (e) => e.payload.moderator, 5).map(
    ({ key, count }) => ({ address: key, count })
  )

  return {
    totalComments: posted.length,
    totalEdits: edited.length,
    uniqueTokens: tokenIds.size,
    uniqueFa2Contracts: fa2Counts.size,
    uniqueCommenters: new Set(senders).size,
    currentlyHidden: computeCurrentlyHidden(hiddenSet, moderated),
    hideActionsBySender: hiddenSet.length,
    hideActionsByModerator: moderated.length,
    topTokens,
    topFa2Contracts,
    topCommenters: topN(posted, (e) => e.payload.sender, 10).map(
      ({ key, count }) => ({ address: key, count })
    ),
    weeklyPosts: bucketWeeks(posted.map((e) => e.payload.timestamp)),
    governance: {
      bannedCount: bannedSet.size,
      bannedAddresses: Array.from(bannedSet),
      proposalEventCounts: {
        pause_set: pauseSet.length,
        post_fee_set: postFeeSet.length,
        edit_fee_set: editFeeSet.length,
        hide_fee_set: hideFeeSet.length,
        user_banned_set: banned.length,
      },
      topModerators,
    },
  }
}

// ============================================================================
// Overview (combined)
// ============================================================================

export async function getOverviewStats(): Promise<OverviewStats> {
  const [pollPosted, tokenPosted, pollEdited, tokenEdited, pollHidden, tokenHidden, pollMod, tokenMod] =
    await Promise.all([
      fetchAllEventsMainnet<PollCommentPostedEvent>(
        POLL_COMMENTS_CONTRACT_MAINNET,
        'comment_posted'
      ),
      fetchAllEventsMainnet<TokenCommentPostedEvent>(
        TOKEN_COMMENTS_CONTRACT_MAINNET,
        'comment_posted'
      ),
      fetchAllEventsMainnet<PollCommentEditedEvent>(
        POLL_COMMENTS_CONTRACT_MAINNET,
        'comment_edited'
      ),
      fetchAllEventsMainnet<TokenCommentEditedEvent>(
        TOKEN_COMMENTS_CONTRACT_MAINNET,
        'comment_edited'
      ),
      fetchAllEventsMainnet<CommentHiddenSetEvent>(
        POLL_COMMENTS_CONTRACT_MAINNET,
        'comment_hidden_set'
      ),
      fetchAllEventsMainnet<CommentHiddenSetEvent>(
        TOKEN_COMMENTS_CONTRACT_MAINNET,
        'comment_hidden_set'
      ),
      fetchAllEventsMainnet<CommentModeratedEvent>(
        POLL_COMMENTS_CONTRACT_MAINNET,
        'comment_moderated'
      ),
      fetchAllEventsMainnet<CommentModeratedEvent>(
        TOKEN_COMMENTS_CONTRACT_MAINNET,
        'comment_moderated'
      ),
    ])

  const senders = new Set<string>()
  for (const e of pollPosted) senders.add(e.payload.sender)
  for (const e of tokenPosted) senders.add(e.payload.sender)

  const weekly = new Map<string, { poll: number; token: number }>()
  const bump = (ts: string, key: 'poll' | 'token') => {
    const w = weekStartISO(ts)
    const cur = weekly.get(w) ?? { poll: 0, token: 0 }
    cur[key] += 1
    weekly.set(w, cur)
  }
  for (const e of pollPosted) bump(e.payload.timestamp, 'poll')
  for (const e of tokenPosted) bump(e.payload.timestamp, 'token')

  const weeklyPosts = Array.from(weekly.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([week, v]) => ({ week, ...v }))

  return {
    pollComments: pollPosted.length,
    tokenComments: tokenPosted.length,
    totalUniqueCommenters: senders.size,
    totalEdits: pollEdited.length + tokenEdited.length,
    totalHides: pollHidden.length + tokenHidden.length + pollMod.length + tokenMod.length,
    weeklyPosts,
  }
}
