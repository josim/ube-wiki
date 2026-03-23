export async function fetchGraphQL(
  query: string,
  operationName: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  variables: Record<string, any>
) {
  const endpoint = process.env.NEXT_PUBLIC_GRAPHQL_API
  if (!endpoint) throw new Error('NEXT_PUBLIC_GRAPHQL_API is not configured')
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables, operationName }),
  })
  if (!res.ok) throw new Error(`GraphQL fetch failed: ${res.status}`)
  const json = await res.json()
  if (json.errors) {
    throw new Error(`GraphQL error: ${json.errors[0]?.message || 'Unknown'}`)
  }
  return json
}
