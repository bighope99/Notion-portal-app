import { NextResponse } from "next/server"

export async function GET() {
  try {
    // ログインページにリダイレクト
    const response = NextResponse.redirect(
      new URL("/login", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
    )

    // 複数の方法を組み合わせて確実にクッキーを削除
    // 方法1: 削除
    response.cookies.delete("auth_token")

    // リダイレクトカウンターもリセット
    response.cookies.delete("redirect_count")

    return response
  } catch (error) {
    console.error("Clear cookies error:", error)

    // エラーが発生しても、ログインページにリダイレクト
    const response = NextResponse.redirect(
      new URL("/login", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
    )

    // 同様にクッキーを削除
    response.cookies.delete("auth_token")

    return response
  }
}
