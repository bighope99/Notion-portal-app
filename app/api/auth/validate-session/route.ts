import { NextResponse } from "next/server"
import { getSession, logout } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const redirectPath = searchParams.get("redirect") || "/dashboard/schedule"

    // セッションの有効性をチェック
    const session = await getSession()

    if (session) {
      // セッションが有効な場合は、元のパスにリダイレクト
      return NextResponse.redirect(new URL(redirectPath, process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"))
    } else {
      // セッションが無効な場合は、ログアウト処理を行い、ログインページにリダイレクト
      await logout()

      // ログインページにリダイレクト（セッション無効のフラグ付き）
      return NextResponse.redirect(
        new URL("/login?session_invalid=true", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
      )
    }
  } catch (error) {
    console.error("Session validation error:", error)

    // エラーが発生した場合も、安全のためにログアウト処理を行う
    try {
      await logout()
    } catch (logoutError) {
      console.error("Logout error during session validation:", logoutError)
    }

    // ログインページにリダイレクト（エラーフラグ付き）
    return NextResponse.redirect(
      new URL("/login?error=session_validation_failed", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
    )
  }
}
