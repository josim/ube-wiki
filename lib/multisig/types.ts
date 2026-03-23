export type ProposalKind =
  | 'add_user'
  | 'remove_user'
  | 'text'
  | 'transfer_mutez'
  | 'transfer_token'
  | 'lambda_function'
  | 'minimum_votes'
  | 'expiration_time'

export interface MutezTransfer {
  amount: number
  destination: string
}

export interface TokenTransferBatch {
  fa2_address: string
  token_id: number
  transfers: { amount: number; destination: string }[]
}

export interface MultisigProposal {
  id: number
  kind: ProposalKind
  issuer: string
  timestamp: string
  positive_votes: number
  executed: boolean
  user?: string
  text?: string
  minimum_votes?: number
  expiration_time?: number
  mutez_transfers?: MutezTransfer[]
  token_transfers?: TokenTransferBatch
}

export interface MultisigVote {
  voter: string
  proposal_id: number
  approval: boolean
}

export interface MultisigStorage {
  users: string[]
  counter: number
  minimum_votes: number
  expiration_time: number
}
