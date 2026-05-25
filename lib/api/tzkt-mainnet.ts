import { TZKT_API_MAINNET } from '@/lib/constants'

async function fetchJson(url: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`TzKT mainnet fetch failed: ${res.status} ${url}`)
  return res.json()
}

function eventsUrl(contract: string, tag: string, extra = '') {
  return `${TZKT_API_MAINNET}/contracts/events?contract=${contract}&tag=${tag}${extra}`
}

export async function fetchEventsMainnet<T>(
  contract: string,
  tag: string,
  extra = ''
): Promise<T[]> {
  return fetchJson(eventsUrl(contract, tag, extra))
}

export async function fetchAllEventsMainnet<T extends { id: number }>(
  contract: string,
  tag: string,
  extra = ''
): Promise<T[]> {
  const pageSize = 10000
  const all: T[] = []
  let offset = 0
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const page = await fetchEventsMainnet<T>(
      contract,
      tag,
      `${extra}&limit=${pageSize}&offset=${offset}&sort.asc=id`
    )
    all.push(...page)
    if (page.length < pageSize) break
    offset += pageSize
  }
  return all
}

interface TokenRow {
  contract: { address: string }
  tokenId: string
  metadata?: {
    name?: string
    thumbnailUri?: string
    displayUri?: string
  }
}

export async function fetchTokensMetadata(
  pairs: { fa2_address: string; token_id: string }[]
): Promise<Map<string, { name: string; thumbnailUri: string }>> {
  const out = new Map<string, { name: string; thumbnailUri: string }>()
  if (pairs.length === 0) return out

  // Group by FA2 to keep URLs short and avoid cross-product issues.
  const byContract = new Map<string, Set<string>>()
  for (const p of pairs) {
    if (!byContract.has(p.fa2_address)) byContract.set(p.fa2_address, new Set())
    byContract.get(p.fa2_address)!.add(p.token_id)
  }

  await Promise.all(
    Array.from(byContract.entries()).map(async ([fa2, ids]) => {
      const idList = Array.from(ids).join(',')
      const url = `${TZKT_API_MAINNET}/tokens?contract=${fa2}&tokenId.in=${idList}&limit=10000`
      try {
        const rows: TokenRow[] = await fetchJson(url)
        for (const row of rows) {
          const key = `${row.contract?.address || fa2}:${row.tokenId}`
          out.set(key, {
            name: row.metadata?.name || '',
            thumbnailUri:
              row.metadata?.thumbnailUri ||
              row.metadata?.displayUri ||
              '',
          })
        }
      } catch {
        // Per-contract failure is non-fatal; the leaderboard falls back to raw ids.
      }
    })
  )

  return out
}
