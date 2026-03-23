import { WikiPage, WikiProposal, ProposalStatus, WikiVersion, WikiDocument, slugToTitle } from './types'
import {
  fetchPageSlugs,
  fetchPageWithVersions,
  fetchWikiProposals,
  fetchWikiProposal,
} from '@/lib/api/tzkt'
import {
  callCreatePage,
  callUpdatePage,
  callCreateProposal,
  callApproveProposal,
  callRejectProposal,
} from '@/lib/contracts/wiki'
import { useWalletStore } from '@/lib/store/walletStore'
import { pinJsonToIPFS } from '@/lib/actions/pinata'
import { fetchFromIPFS, fetchWikiDocument } from '@/lib/helpers/ipfs'

// =========================================================================
// Read operations (TzKT API)
// =========================================================================

export async function getPageList(): Promise<{ slug: string; title: string }[]> {
  const slugs = await fetchPageSlugs()
  return slugs.map((slug) => ({ slug, title: slugToTitle(slug) }))
}

export async function getPage(slug: string): Promise<WikiPage | null> {
  const result = await fetchPageWithVersions(slug)
  if (!result) return null

  const versions: WikiVersion[] = result.versions
    .map((v) => ({
      cid: v.cid,
      editor: v.editor,
      timestamp: v.ts,
      version: parseInt(v.version, 10),
    }))
    .sort((a, b) => a.version - b.version)

  return {
    slug,
    title: slugToTitle(slug),
    current_cid: result.cid,
    versions,
  }
}

export async function getPageContent(cid: string): Promise<string> {
  if (!cid) return ''
  return fetchFromIPFS(cid)
}

export async function getWikiDocument(cid: string): Promise<WikiDocument | null> {
  if (!cid) return null
  return fetchWikiDocument(cid)
}

// =========================================================================
// Write operations (Taquito wallet calls)
// =========================================================================

function getTezos() {
  return useWalletStore.getState().Tezos
}

function getAddress(): string {
  return useWalletStore.getState().address || ''
}

function buildDocument(
  content: string,
  title: string,
  slug: string,
  summary: string
): WikiDocument {
  return {
    schema_version: 1,
    title,
    slug,
    content,
    format: 'markdown',
    author: getAddress(),
    timestamp: new Date().toISOString(),
    summary,
  }
}

export async function createPage(
  title: string,
  slug: string,
  content: string,
  summary: string
): Promise<void> {
  const doc = buildDocument(content, title, slug, summary)
  const cid = await pinJsonToIPFS(doc)
  if (!cid) throw new Error('Failed to pin content to IPFS')
  await callCreatePage(getTezos(), slug, `ipfs://${cid}`)
}

export async function updatePage(
  slug: string,
  title: string,
  content: string,
  summary: string
): Promise<void> {
  const doc = buildDocument(content, title, slug, summary)
  const cid = await pinJsonToIPFS(doc)
  if (!cid) throw new Error('Failed to pin content to IPFS')
  await callUpdatePage(getTezos(), slug, `ipfs://${cid}`)
}

export async function createProposal(
  pageSlug: string,
  title: string,
  content: string,
  summary: string
): Promise<void> {
  const doc = buildDocument(content, title, pageSlug, summary)
  const cid = await pinJsonToIPFS(doc)
  if (!cid) throw new Error('Failed to pin content to IPFS')
  await callCreateProposal(getTezos(), pageSlug, `ipfs://${cid}`)
}

export async function approveProposal(id: number): Promise<void> {
  await callApproveProposal(getTezos(), id)
}

export async function rejectProposal(id: number): Promise<void> {
  await callRejectProposal(getTezos(), id)
}

// =========================================================================
// Proposal reads (TzKT API)
// =========================================================================

export async function getProposals(
  status?: ProposalStatus
): Promise<WikiProposal[]> {
  const raw = await fetchWikiProposals()

  const proposals: WikiProposal[] = raw.map((entry) => ({
    id: parseInt(entry.key, 10),
    page_slug: entry.value.page_slug,
    proposed_cid: entry.value.proposed_cid,
    proposer: entry.value.proposer,
    status: parseInt(entry.value.status, 10) as ProposalStatus,
    created_at: entry.value.created_at,
  }))

  if (status !== undefined) {
    return proposals.filter((p) => p.status === status)
  }
  return proposals
}

export async function getProposal(id: number): Promise<WikiProposal | null> {
  const raw = await fetchWikiProposal(id)
  if (!raw) return null

  return {
    id,
    page_slug: raw.page_slug,
    proposed_cid: raw.proposed_cid,
    proposer: raw.proposer,
    status: parseInt(raw.status, 10) as ProposalStatus,
    created_at: raw.created_at,
  }
}

export async function getProposalContent(cid: string): Promise<string> {
  if (!cid) return ''
  return fetchFromIPFS(cid)
}
