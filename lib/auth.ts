"use server"

import { cookies } from "next/headers"
import { getStudentByEmail } from "./notion"
import { createHash } from "crypto"
import { generateToken, verifyToken } from "./token"
import { sendEmail } from "./email"
import { savePasswordHash, getPasswordHashByEmail } from "./notion"

// 秘密鍵
const SECRET_KEY = process.env.SECRET_KEY || "default-secret-key"

// パスワードのハッシュ化
// SECRET_KEYをソルトとして使用し、SHA-256アルゴリズムでハッシュ化
export async function hashPassword(password: string): Promise<string> {
  // パスワードとSECRET_KEYを組み合わせてハッシュ化することで、
  // 同じパスワードでも異なるSECRET_KEYを使用すれば異なるハッシュ値になる
  // これにより、レインボーテーブル攻撃などに対する耐性が高まる
  return createHash("sha256").update(`${password}${SECRET_KEY}`).digest("hex")
}

// パスワードの検証
export async function verifyPassword(email: string, password: string): Promise<boolean> {
  const storedHash = await getPasswordHashByEmail(email)
  if (!storedHash) return false

  const inputHash = await hashPassword(password)
  return storedHash === inputHash
}

// パスワードの設定
export async function setupPassword(userId: string, password: string): Promise<boolean> {
  const passwordHash = await hashPassword(password)
  return await savePasswordHash(userId, passwordHash)
}

// パスワードログイン
export async function loginWithPassword(email: string, password: string) {
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

    // パスワードの検証
    const isPasswordValid = await verifyPassword(email, password)
    if (!isPasswordValid) {
      console.log(`Invalid password for: ${email}`)
      return { success: false, error: "invalid_password" }
    }

    // セッションの保存
    const token = await generateToken(email)
    const cookieStore = cookies()
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1週間
      path: "/",
    })

    return { success: true }
  } catch (error) {
    console.error("Password login error:", error)
    return { success: false, error: "server_error" }
  }
}

// ログイン処理
export async function login(email: string, isReset = false) {
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

    // パスワードが設定されているかどうかを確認
    const hasPassword = !!student.passwordHash

    // マジックリンク用のトークンを生成
    const token = await generateToken(email)

    // マジックリンクのURLを生成
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    // パスワードリセットの場合は、reset=trueパラメータを追加
    const resetParam = isReset ? "&reset=true" : ""
    const loginUrl = `${appUrl}/api/auth/callback?token=${encodeURIComponent(token)}${resetParam}`

    console.log("Magic Link:", loginUrl) // 開発用。実際のアプリではメールで送信

    // メール送信（GASを使用）
    try {
      const subject = isReset ? "パスワードリセットリンク" : "学習ポータルへのログインリンク"
      const content = isReset
        ? `<p>パスワードをリセットするには、以下のリンクをクリックしてください：</p>
           <p><a href="${loginUrl}">パスワードをリセットする</a></p>
           <p>このリンクの有効期限は24時間です。</p>`
        : `<p>学習ポータルにログインするには、以下のリンクをクリックしてください：</p>
           <p><a href="${loginUrl}">ログインする</a></p>
           <p>このリンクの有効期限は24時間です。</p>`

      const emailResult = await sendEmail(email, subject, content)

      if (emailResult.mock) {
        console.log("Email sending mocked in development environment")
      } else if (emailResult.error) {
        console.warn("Email sending had errors but continuing login process:", emailResult.error)
      }
    } catch (emailError) {
      console.error("Email sending error:", emailError)
      // メール送信に失敗しても処理は続行（ログには出力）
    }

    return { success: true, hasPassword }
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

    // パスワードが設定されているかどうかを確認
    const hasPassword = !!student.passwordHash

    return { success: true, hasPassword, userId: student.id }
  } catch (error) {
    console.error("Callback error:", error)
    return { success: false, error: "Authentication failed" }
  }
}
