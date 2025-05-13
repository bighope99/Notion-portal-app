import { createHmac, randomBytes } from "crypto"

// 秘密鍵
// SECRET_KEYは、トークンの署名と検証に使用される重要なセキュリティキー
// このキーが漏洩すると、トークンの偽造が可能になるため、厳重に管理する必要がある
const SECRET_KEY = process.env.SECRET_KEY || "default-secret-key"

// トークンの生成
export async function generateToken(email: string): Promise<string> {
  // トークンの構成要素
  const timestamp = Date.now() // 現在のタイムスタンプ
  const randomString = randomBytes(16).toString("hex") // ランダム文字列（リプレイ攻撃対策）

  // HMAC-SHA256を使用して署名を生成
  // これにより、トークンが改ざんされていないことを検証できる
  const hmac = createHmac("sha256", SECRET_KEY)
  hmac.update(`${email}:${timestamp}:${randomString}`)
  const signature = hmac.digest("hex")

  // トークンの構成: email:timestamp:randomString:signature
  // Base64エンコードして返す
  return Buffer.from(`${email}:${timestamp}:${randomString}:${signature}`).toString("base64")
}

// トークンの検証
export async function verifyToken(token: string): Promise<{ email: string } | null> {
  try {
    // Base64デコード
    const decoded = Buffer.from(token, "base64").toString()
    const [email, timestamp, randomString, signature] = decoded.split(":")

    // 有効期限チェック (24時間)
    const now = Date.now()
    const tokenTime = Number.parseInt(timestamp)
    if (now - tokenTime > 24 * 60 * 60 * 1000) {
      return null
    }

    // 署名の検証
    // トークン生成時と同じ方法で署名を計算し、比較
    const hmac = createHmac("sha256", SECRET_KEY)
    hmac.update(`${email}:${timestamp}:${randomString}`)
    const expectedSignature = hmac.digest("hex")

    // 署名が一致しない場合は、トークンが改ざんされている可能性がある
    if (signature !== expectedSignature) {
      return null
    }

    return { email }
  } catch (error) {
    console.error("Token verification error:", error)
    return null
  }
}
