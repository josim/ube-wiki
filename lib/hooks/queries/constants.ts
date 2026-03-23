/** Shared staleTime constants for React Query hooks. */
export const STALE = {
  /** Contract storage — changes infrequently */
  STORAGE: 30_000,
  /** Page list — new pages are rare */
  PAGES: 30_000,
  /** Single page data — moderate update frequency */
  PAGE: 30_000,
  /** Proposal lists — can change when voted/executed */
  PROPOSALS: 15_000,
  /** Vote data — changes on each vote */
  VOTES: 15_000,
  /** IPFS content — immutable by hash */
  IPFS: Infinity,
  /** User profiles — rarely change */
  PROFILES: 5 * 60_000,
} as const
