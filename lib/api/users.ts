import { fetchGraphQL } from './graphql'
import { TEZOS_DOMAINS_API } from '@/lib/constants'

function avatarUrl(ipfsUri: string): string {
  if (!ipfsUri?.startsWith('ipfs://')) return ''
  return `${process.env.NEXT_PUBLIC_TEIA_GATEWAY}${ipfsUri.replace('ipfs://', '')}`
}

export interface UserProfile {
  address: string
  name: string
  domain: string
  avatar: string
  description: string
}

const GET_USER_PROFILES = `
  query getUserProfiles($addresses: [String!]!) {
    teia_users(where: { user_address: { _in: $addresses } }) {
      user_address
      name
      metadata {
        data
      }
    }
  }
`

const GET_USER_BY_NAME = `
  query getUserByName($name: String!) {
    teia_users(where: { name: { _eq: $name } }) {
      user_address
      name
      metadata {
        data
      }
    }
  }
`

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapUser(user: any): UserProfile {
  const identicon = user.metadata?.data?.identicon
  const description = user.metadata?.data?.description
  return {
    address: user.user_address,
    name: user.name || '',
    domain: '',
    avatar: identicon ? avatarUrl(identicon) : '',
    description: description || '',
  }
}

/**
 * Batch-fetch Tezos Domain reverse records for addresses.
 * Returns a Map of address → domain name (e.g. "jagracar.tez").
 */
async function fetchTezosDomains(
  addresses: string[]
): Promise<Map<string, string>> {
  const result = new Map<string, string>()
  if (addresses.length === 0) return result

  try {
    const res = await fetch(TEZOS_DOMAINS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `query reverseRecords($addresses: [Address!]!) {
          reverseRecords(where: { address: { in: $addresses } }) {
            items { address domain { name } }
          }
        }`,
        variables: { addresses },
      }),
    })

    if (!res.ok) return result
    const json = await res.json()
    const items = json?.data?.reverseRecords?.items ?? []
    for (const item of items) {
      if (item.address && item.domain?.name) {
        result.set(item.address, item.domain.name)
      }
    }
  } catch {
    // Tezos Domains is a best-effort fallback — don't throw
  }

  return result
}

/**
 * Batch-fetch profiles: Teia SUBJKT first, then Tezos Domains for all addresses.
 * SUBJKT provides name + avatar. Tezos Domains provides .tez domain.
 * If no SUBJKT name exists, the domain is used as display name fallback.
 */
export async function fetchUserProfiles(
  addresses: string[]
): Promise<Map<string, UserProfile>> {
  if (addresses.length === 0) return new Map()

  // Fetch SUBJKT profiles and Tezos Domains in parallel
  const [graphqlResult, domains] = await Promise.all([
    fetchGraphQL(GET_USER_PROFILES, 'getUserProfiles', { addresses }),
    fetchTezosDomains(addresses),
  ])

  const profiles = new Map<string, UserProfile>()

  // Populate from SUBJKT
  if (graphqlResult.data?.teia_users) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const user of graphqlResult.data.teia_users) {
      profiles.set(user.user_address, mapUser(user))
    }
  }

  // Merge Tezos Domains into profiles
  for (const [addr, domain] of Array.from(domains.entries())) {
    const existing = profiles.get(addr)
    if (existing) {
      existing.domain = domain
    } else {
      profiles.set(addr, { address: addr, name: '', domain, avatar: '', description: '' })
    }
  }

  return profiles
}

/**
 * Resolve a SUBJKT name to an address. Used when navigating to /tz/somename.
 */
export async function resolveNameToAddress(
  name: string
): Promise<string | null> {
  const { data } = await fetchGraphQL(GET_USER_BY_NAME, 'getUserByName', {
    name,
  })
  if (!data?.teia_users?.length) return null
  return data.teia_users[0].user_address
}
