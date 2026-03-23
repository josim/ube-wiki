import { TezosToolkit } from '@taquito/taquito'
import { MODERATOR_CONTRACT } from '@/lib/constants'

export async function callSubmitProposal(
  tezos: TezosToolkit,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  action: any
): Promise<string> {
  const contract = await tezos.wallet.at(MODERATOR_CONTRACT)
  const op = await contract.methodsObject.submit_proposal(action).send()
  await op.confirmation(1)
  return op.opHash
}

export async function callVoteProposal(
  tezos: TezosToolkit,
  proposalId: number,
  approval: boolean
): Promise<string> {
  const contract = await tezos.wallet.at(MODERATOR_CONTRACT)
  const op = await contract.methodsObject
    .vote_proposal({ proposal_id: proposalId, approval })
    .send()
  await op.confirmation(1)
  return op.opHash
}

export async function callExecuteProposal(
  tezos: TezosToolkit,
  proposalId: number
): Promise<string> {
  const contract = await tezos.wallet.at(MODERATOR_CONTRACT)
  const op = await contract.methods.execute_proposal(proposalId).send()
  await op.confirmation(1)
  return op.opHash
}
