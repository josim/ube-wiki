// Mirrors contract storage shape — assembled from TzKT bigmap queries

export interface WikiVersion {
  cid: string
  editor: string
  timestamp: string
  version: number
}

export interface WikiPage {
  slug: string
  title: string
  current_cid: string
  versions: WikiVersion[]
}

/** JSON document stored on IPFS. */
export interface WikiDocument {
  /** Schema version — always 1 for now */
  schema_version: 1
  /** Page title */
  title: string
  /** URL slug */
  slug: string
  /** Markdown content */
  content: string
  /** Content format */
  format: 'markdown'
  /** Wallet address of the author */
  author: string
  /** ISO 8601 timestamp */
  timestamp: string
  /** Edit summary */
  summary: string
}

// 0 = pending, 1 = approved, 2 = rejected
export type ProposalStatus = 0 | 1 | 2

export interface WikiProposal {
  id: number
  page_slug: string
  proposed_cid: string
  proposer: string
  status: ProposalStatus
  created_at: string
}

/** Convert a slug like "getting-started" to a title like "Getting Started" */
export function slugToTitle(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/** Convert a title like "Getting Started" to a slug like "getting-started" */
export function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}
