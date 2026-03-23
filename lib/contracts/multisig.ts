import { TezosToolkit } from '@taquito/taquito'
import { MULTISIG_CONTRACT } from '@/lib/constants'

async function callMultisig(
  tezos: TezosToolkit,
  entrypoint: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...args: any[]
): Promise<string> {
  const contract = await tezos.wallet.at(MULTISIG_CONTRACT)
  const op = await contract.methods[entrypoint](...args).send()
  await op.confirmation(1)
  return op.opHash
}

// Proposal creation
export function callAddUserProposal(tezos: TezosToolkit, address: string) {
  return callMultisig(tezos, 'add_user_proposal', address)
}

export function callRemoveUserProposal(tezos: TezosToolkit, address: string) {
  return callMultisig(tezos, 'remove_user_proposal', address)
}

export function callTextProposal(tezos: TezosToolkit, text: string) {
  return callMultisig(tezos, 'text_proposal', text)
}

export function callTransferMutezProposal(
  tezos: TezosToolkit,
  transfers: { amount: number; destination: string }[]
) {
  return callMultisig(tezos, 'transfer_mutez_proposal', transfers)
}

export function callTransferTokenProposal(
  tezos: TezosToolkit,
  fa2Address: string,
  tokenId: number,
  transfers: { amount: number; destination: string }[]
) {
  return callMultisig(tezos, 'transfer_token_proposal', fa2Address, tokenId, transfers)
}

export function callLambdaFunctionProposal(
  tezos: TezosToolkit,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lambda: any
) {
  return callMultisig(tezos, 'lambda_function_proposal', lambda)
}

export function callMinimumVotesProposal(tezos: TezosToolkit, votes: number) {
  return callMultisig(tezos, 'minimum_votes_proposal', votes)
}

export function callExpirationTimeProposal(tezos: TezosToolkit, days: number) {
  return callMultisig(tezos, 'expiration_time_proposal', days)
}

// Voting and execution
export function callVoteProposal(
  tezos: TezosToolkit,
  proposalId: number,
  approval: boolean
) {
  return callMultisig(tezos, 'vote_proposal', proposalId, approval)
}

export function callExecuteProposal(tezos: TezosToolkit, proposalId: number) {
  return callMultisig(tezos, 'execute_proposal', proposalId)
}
