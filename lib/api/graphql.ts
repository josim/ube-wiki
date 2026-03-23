export async function fetchGraphQL(
  query: string,
  operationName: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  variables: Record<string, any>
) {
  const res = await fetch(process.env.NEXT_PUBLIC_GRAPHQL_API, {
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
