import type { WikiDocument } from '@/lib/wiki/types'

/**
 * Fetches a WikiDocument from IPFS with dual-gateway fallback.
 * Returns the full WikiDocument object.
 */
export async function fetchWikiDocument(cid: string, timeout = 5000): Promise<WikiDocument> {
  return fetchFromGateways(cid, timeout)
}

/**
 * Fetches a WikiDocument from IPFS and returns just the markdown content string.
 */
export async function fetchFromIPFS(cid: string, timeout = 5000): Promise<string> {
  const doc = await fetchFromGateways(cid, timeout)
  return doc.content
}

async function fetchFromGateways(cid: string, timeout: number): Promise<WikiDocument> {
  const cleanHash = cid.replace('ipfs://', '')

  // Try primary gateway first
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    const response = await fetch(`${process.env.NEXT_PUBLIC_IPFS_GATEWAY}${cleanHash}`, {
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (response.ok) {
      return parseWikiDocument(await response.json())
    }
  } catch {
    // Timeout or network error — fall through to fallback
  }

  // Fallback to public gateway
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    const response = await fetch(`${process.env.NEXT_PUBLIC_FALLBACK_GATEWAY}${cleanHash}`, {
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (response.ok) {
      return parseWikiDocument(await response.json())
    }
  } catch {
    // Fallback also failed
  }

  throw new Error(`Failed to fetch from IPFS: ${cleanHash}`)
}

function parseWikiDocument(doc: unknown): WikiDocument {
  if (typeof doc === 'object' && doc !== null && 'content' in doc && typeof (doc as { content: unknown }).content === 'string') {
    return doc as WikiDocument
  }
  throw new Error('Invalid WikiDocument: missing content field')
}

/**
 * Returns the primary gateway URL for a CID (for direct linking).
 */
export function getIPFSUrl(cid: string): string {
  const cleanHash = cid.replace('ipfs://', '')
  return `${process.env.NEXT_PUBLIC_IPFS_GATEWAY}${cleanHash}`
}
