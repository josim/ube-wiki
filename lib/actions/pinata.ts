"use server"

const pinataApiKey = process.env.PINATA_API_KEY
const pinataSecretApiKey = process.env.PINATA_SECRET_API_KEY

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const pinJsonToIPFS = async (json: any): Promise<string | null> => {
  if (!pinataApiKey || !pinataSecretApiKey) {
    console.error("Pinata API keys not configured")
    return null
  }

  try {
    const upload = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        pinata_api_key: pinataApiKey,
        pinata_secret_api_key: pinataSecretApiKey,
      },
      body: JSON.stringify(json),
    })
    if (!upload.ok) {
      const body = await upload.text()
      console.error(`Pinata upload failed: ${upload.status} ${body}`)
      return null
    }
    const uploadRes = await upload.json()
    return uploadRes.IpfsHash
  } catch (error) {
    console.error("Failed to pin JSON to IPFS:", error)
    return null
  }
}
