import { TezosToolkit } from '@taquito/taquito'
import { WIKI_CONTRACT } from '@/lib/constants'

// Taquito wallet operations for wiki contract writes

export async function callCreatePage(
  tezos: TezosToolkit,
  slug: string,
  cid: string
): Promise<string> {
  const contract = await tezos.wallet.at(WIKI_CONTRACT)
  const op = await contract.methods.create_page(slug, cid).send()
  await op.confirmation(1)
  return op.opHash
}

export async function callUpdatePage(
  tezos: TezosToolkit,
  slug: string,
  cid: string
): Promise<string> {
  const contract = await tezos.wallet.at(WIKI_CONTRACT)
  const op = await contract.methods.update_page(slug, cid).send()
  await op.confirmation(1)
  return op.opHash
}

export async function callCreateProposal(
  tezos: TezosToolkit,
  pageSlug: string,
  proposedCid: string
): Promise<string> {
  const contract = await tezos.wallet.at(WIKI_CONTRACT)
  const op = await contract.methods
    .create_proposal(pageSlug, proposedCid)
    .send()
  await op.confirmation(1)
  return op.opHash
}

export async function callApproveProposal(
  tezos: TezosToolkit,
  proposalId: number
): Promise<string> {
  const contract = await tezos.wallet.at(WIKI_CONTRACT)
  const op = await contract.methods.approve_proposal(proposalId).send()
  await op.confirmation(1)
  return op.opHash
}

export async function callRejectProposal(
  tezos: TezosToolkit,
  proposalId: number
): Promise<string> {
  const contract = await tezos.wallet.at(WIKI_CONTRACT)
  const op = await contract.methods.reject_proposal(proposalId).send()
  await op.confirmation(1)
  return op.opHash
}
