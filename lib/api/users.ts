import { fetchGraphQL } from './graphql'

function avatarUrl(ipfsUri: string): string {
  if (!ipfsUri?.startsWith('ipfs://')) return ''
  return `${process.env.NEXT_PUBLIC_TEIA_GATEWAY}${ipfsUri.replace('ipfs://', '')}`
}

export interface UserProfile {
  address: string
  name: string
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

const GET_USER_BY_ADDRESS = `
  query getUserByAddress($address: String!) {
    teia_users(where: { user_address: { _eq: $address } }) {
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
    avatar: identicon ? avatarUrl(identicon) : '',
    description: description || '',
  }
}

export async function fetchUserProfiles(
  addresses: string[]
): Promise<Map<string, UserProfile>> {
  if (addresses.length === 0) return new Map()

  const { data } = await fetchGraphQL(GET_USER_PROFILES, 'getUserProfiles', {
    addresses,
  })

  const profiles = new Map<string, UserProfile>()
  if (!data?.teia_users) return profiles

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const user of data.teia_users) {
    profiles.set(user.user_address, mapUser(user))
  }

  return profiles
}

export async function fetchUserByAddress(
  address: string
): Promise<UserProfile | null> {
  const { data } = await fetchGraphQL(GET_USER_BY_ADDRESS, 'getUserByAddress', {
    address,
  })
  if (!data?.teia_users?.length) return null
  return mapUser(data.teia_users[0])
}

export async function fetchUserByName(
  name: string
): Promise<UserProfile | null> {
  const { data } = await fetchGraphQL(GET_USER_BY_NAME, 'getUserByName', {
    name,
  })
  if (!data?.teia_users?.length) return null
  return mapUser(data.teia_users[0])
}
