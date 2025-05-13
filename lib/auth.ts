"use server"

import { cookies } from "next/headers"
import { getStudentByEmail } from "./notion"
import { createHmac, randomBytes } from "crypto"

// 秘密鍵
const SECRET_KEY = process.env.MAGIC_SECRET_KEY || "default-secret-key"

// トークンの生成
export async function generateToken(email: string): Promise<string> {
  const timestamp = Date.now()
  const randomString = randomBytes(16).toString("hex")
  const hmac = createHmac("sha256", SECRET_KEY)
  hmac.update(`${email}:${timestamp}:${randomString}`)
  const signature = hmac.digest("hex")
  return Buffer.from(`${email}:${timestamp}:${randomString}:${signature}`).toString("base64")
}

// トークンの検証
export async function verifyToken(token: string): Promise<{ email: string } | null> {
  try {
    const decoded = Buffer.from(token, "base64").toString()
    const [email, timestamp, randomString, signature] = decoded.split(":")

    // 有効期限チェック (24時間)
    const now = Date.now()
    const tokenTime = Number.parseInt(timestamp)
    if (now - tokenTime > 24 * 60 * 60 * 1000) {
      return null
    }

    // 署名の検証
    const hmac = createHmac("sha256", SECRET_KEY)
    hmac.update(`${email}:${timestamp}:${randomString}`)
    const expectedSignature = hmac.digest("hex")

    if (signature !== expectedSignature) {
      return null
    }

    return { email }
  } catch (error) {
    console.error("Token verification error:", error)
    return null
  }
}

// ログイン処理
export async function login(email: string) {
  try {
    // Notionから学生情報を取得
    const student = await getStudentByEmail(email)

    if (!student) {
      console.log(`User not found: ${email}`)
      return { success: false, error: "user_not_found" }
    }

    if (student.isRetired) {
      console.log(`Retired user: ${email}`)
      return { success: false, error: "user_retired" }
    }

    // マジックリンク用のトークンを生成
    const token = await generateToken(email)

    // マジックリンクのURLを生成
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/callback?token=${encodeURIComponent(token)}`

    console.log("Magic Link:", loginUrl) // 開発用。実際のアプリではメールで送信

    // ここに実際のメール送信ロジックを実装
    // 例: await sendEmail(email, "ログインリンク", `ログインするには<a href="${loginUrl}">こちら</a>をクリックしてください。`);

    return { success: true }
  } catch (error) {
    console.error("Login error:", error)
    return { success: false, error: "server_error" }
  }
}

// セッションの取得
export async function getSession() {
  const cookieStore = cookies()
  const token = cookieStore.get("auth_token")?.value

  if (!token) {
    return null
  }

  try {
    // トークンを検証
    const payload = await verifyToken(token)

    if (!payload?.email) {
      return null
    }

    // Notionから学生情報を取得
    const student = await getStudentByEmail(payload.email)

    if (!student) {
      console.log(`Session validation failed: User not found for email ${payload.email}`)
      return null
    }

    if (student.isRetired) {
      console.log(`Session validation failed: User is retired: ${payload.email}`)
      return null
    }

    return {
      user: {
        email: payload.email,
        id: student.id,
        name: student.name,
        personalPage: student.personalPage,
        progress: student.progress,
      },
    }
  } catch (error) {
    console.error("Session error:", error)
    return null
  }
}

// ログアウト処理
export async function logout() {
  const cookieStore = cookies()
  cookieStore.delete("auth_token")
}

// コールバック処理
export async function handleCallback(token: string) {
  try {
    // トークンを検証
    const payload = await verifyToken(token)

    if (!payload?.email) {
      return { success: false, error: "Invalid token" }
    }

    // Notionから学生情報を取得
    const student = await getStudentByEmail(payload.email)

    if (!student) {
      console.log(`Callback validation failed: User not found for email ${payload.email}`)
      return { success: false, error: "User not found" }
    }

    if (student.isRetired) {
      console.log(`Callback validation failed: User is retired: ${payload.email}`)
      return { success: false, error: "User is retired" }
    }

    // セッションの保存
    const cookieStore = cookies()
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1週間
      path: "/",
    })

    return { success: true }
  } catch (error) {
    console.error("Callback error:", error)
    return { success: false, error: "Authentication failed" }
  }
}
