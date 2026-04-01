"use server"

const ipfsProxy = process.env.IPFS_UPLOAD_PROXY

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const uploadJsonToIPFS = async (json: any): Promise<string | null> => {
  if (!ipfsProxy) {
    console.error("IPFS_UPLOAD_PROXY not configured")
    return null
  }

  try {
    const blob = new Blob([JSON.stringify(json)], { type: "application/json" })
    const form = new FormData()
    form.append("asset", new File([blob], "metadata.json", { type: "application/json" }))

    const res = await fetch(`${ipfsProxy}/single`, {
      method: "POST",
      body: form,
    })

    if (!res.ok) {
      const body = await res.text()
      console.error(`IPFS proxy upload failed: ${res.status} ${body}`)
      return null
    }

    const data = await res.json()
    return data.cid
  } catch (error) {
    console.error("Failed to upload JSON to IPFS:", error)
    return null
  }
}
