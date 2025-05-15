import { NextResponse } from "next/server"
import { forceLogout } from "@/lib/auth"

export async function GET() {
  try {
    // 強制ログアウト処理
    await forceLogout()

    // ログインページにリダイレクト
    const response = NextResponse.redirect(
      new URL("/login", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
    )

    // すべての認証関連クッキーを確実に削除
    response.cookies.delete("auth_token")
    response.cookies.delete("redirect_count")

    // 追加のセキュリティとして、期限切れの値を設定
    response.cookies.set("auth_token", "", {
      expires: new Date(0),
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    })

    return response
  } catch (error) {
    console.error("Force logout error:", error)

    // エラーが発生しても、ログインページにリダイレクト
    const response = NextResponse.redirect(
      new URL("/login", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
    )
    response.cookies.delete("auth_token")
    response.cookies.delete("redirect_count")

    return response
  }
}
