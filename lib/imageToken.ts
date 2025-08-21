import crypto from "crypto"

const DEFAULT_TTL_SECONDS = 60 * 60 * 6 // 6 hours

function base64url(input: Buffer | string) {
  return (typeof input === "string" ? Buffer.from(input) : input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "")
}

export function getSecret() {
  const secret = process.env.SECURE_IMAGE_SECRET || process.env.NEXTAUTH_SECRET
  if (!secret) {
    throw new Error("SECURE_IMAGE_SECRET or NEXTAUTH_SECRET must be set")
  }
  return secret
}

export function generateImageToken(cardId: string, type: string, ttlSeconds = DEFAULT_TTL_SECONDS) {
  const ts = Math.floor(Date.now() / 1000)
  const exp = ts + ttlSeconds
  const payload = `${cardId}:${type}:${exp}`
  const hmac = crypto.createHmac("sha256", getSecret())
  hmac.update(payload)
  const sig = base64url(hmac.digest())
  return `${sig}.${exp}`
}

export function verifyImageToken(token: string, cardId: string, type: string) {
  if (!token || !token.includes(".")) return false
  const [sig, expStr] = token.split(".")
  const exp = Number(expStr)
  if (!Number.isFinite(exp)) return false
  const now = Math.floor(Date.now() / 1000)
  if (exp < now) return false

  const payload = `${cardId}:${type}:${exp}`
  const hmac = crypto.createHmac("sha256", getSecret())
  hmac.update(payload)
  const expected = base64url(hmac.digest())
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
}