"use server"

import { cookies } from "next/headers"
import { getStudentByEmail } from "./notion"
import { createHash } from "crypto"
import { generateToken, verifyToken } from "./token"
import { sendEmail } from "./email" // @/lib/mail から @/lib/email に修正
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
      return { success: false, error: "user_not_found" }
    }

    if (student.isRetired) {
      return { success: false, error: "user_retired" }
    }

    // パスワードの検証
    const isPasswordValid = await verifyPassword(email, password)
    if (!isPasswordValid) {
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
      return { success: false, error: "user_not_found" }
    }

    if (student.isRetired) {
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
    // パスワードが既に設定されている場合は、has_password=trueパラメータを追加
    const passwordParam = hasPassword && !isReset ? "&has_password=true" : ""
    const loginUrl = `${appUrl}/api/auth/callback?token=${encodeURIComponent(token)}${resetParam}${passwordParam}`

    // メール送信（GASを使用）
    try {
      const subject = isReset ? "パスワードリセットリンク" : "学習ポータルへのログインリンク"
      const content = isReset
        ? `<p>パスワードをリセットするには、以下のリンクをクリックしてください：</p>
           <p><a href="${loginUrl}">パスワードをリセットする</a></p>
           <p>このリンクの有効期限は24時間です。</p>`
        : `<p>学習ポータルにログインするには、以下のリンクをクリックしてください：</p>
           <p><a href="${loginUrl}">ログインする</a></p>
           <p>このリンクの有効期限は24時間です。</p>
           ${hasPassword ? "<p>※パスワードを設定済みの方は、ログインページからパスワードでもログインできます。</p>" : ""}`

      const emailResult = await sendEmail(email, subject, content)

      if (emailResult.mock) {
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
      // 無効なトークンの場合はnullを返す
      return null
    }

    // Notionから学生情報を取得
    const student = await getStudentByEmail(payload.email)

    if (!student) {
      // 学生情報が見つからない場合はnullを返す
      return null
    }

    if (student.isRetired) {
      // 退会済みの場合はnullを返す
      return null
    }

    return {
      user: {
        email: payload.email,
        id: student.id,
        name: student.name,
        personalPageId: student.personalPageId || "", // 個人ページのリレーションID
        personalPage: student.personalPage || "", // 従来の個人ページ（テキスト）も保持
        progress: student.progress,
      },
    }
  } catch (error) {
    console.error("Session error:", error)
    // エラーが発生した場合もnullを返す
    return null
  }
}

// ログアウト処理
export async function logout() {
  const cookieStore = cookies()

  // 確実にCookieを削除
  cookieStore.delete("auth_token", {
    path: "/",
    // 他のオプションも追加して確実に削除
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 0,
    expires: new Date(0),
  })

  // リダイレクトカウンターをリセット
  cookieStore.delete("redirect_count", {
    path: "/",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  })

  // 追加のセキュリティとして、期限切れの値を設定
  cookieStore.set("auth_token", "", {
    expires: new Date(0),
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  })

  return true
}

// 強制ログアウト処理 - リダイレクトループ対策
export async function forceLogout() {
  const cookieStore = cookies()

  // すべての認証関連Cookieを削除
  cookieStore.delete("auth_token", {
    path: "/",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  })

  cookieStore.delete("redirect_count", {
    path: "/",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  })

  // 追加のセキュリティとして、期限切れの値を設定
  cookieStore.set("auth_token", "", {
    expires: new Date(0),
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  })

  // ログ出力
  console.warn("Force logout executed due to redirect loop")

  return true
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
      return { success: false, error: "User not found" }
    }

    if (student.isRetired) {
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

    // リダイレクトカウンターをリセット
    cookieStore.set("redirect_count", "0", {
      path: "/",
      maxAge: 60, // 1分間だけ有効
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    })

    // パスワードが設定されているかどうかを確認
    const hasPassword = !!student.passwordHash

    return { success: true, hasPassword, userId: student.id }
  } catch (error) {
    console.error("Callback error:", error)
    return { success: false, error: "Authentication failed" }
  }
}
