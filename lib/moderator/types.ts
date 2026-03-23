export type ModeratorActionKind =
  | 'add_moderator'
  | 'remove_moderator'
  | 'update_multisig_address'
  | 'update_metadata'

export interface ModeratorProposal {
  id: number
  action: ModeratorActionKind
  issuer: string
  timestamp: string
  positive_votes: number
  minimum_votes: number
  executed: boolean
  // Variant-specific fields
  address?: string
  metadata_key?: string
  metadata_value?: string
}

export interface ModeratorVote {
  voter: string
  proposal_id: number
  approval: boolean
}

export interface ModeratorStorage {
  moderators: string[]
  multisig_address: string
  counter: number
}
