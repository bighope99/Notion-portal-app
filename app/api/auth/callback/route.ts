import { NextResponse } from "next/server"
import { handleCallback } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const token = url.searchParams.get("token")
    const isReset = url.searchParams.get("reset") === "true"

    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    const result = await handleCallback(token)

    if (result.success) {
      // パスワードリセットの場合は、常にパスワード設定ページにリダイレクト
      if (isReset) {
        return NextResponse.redirect(new URL("/dashboard/setup-password", request.url))
      }

      // パスワードが設定されているか確認
      const hasPassword = result.hasPassword || false

      // パスワードが設定されていない場合は、パスワード設定ページにリダイレクト
      if (!hasPassword) {
        return NextResponse.redirect(new URL("/dashboard/setup-password", request.url))
      }

      // それ以外は予定ページにリダイレクト
      return NextResponse.redirect(new URL("/dashboard/schedule", request.url))
    } else {
      return NextResponse.redirect(new URL("/login", request.url))
    }
  } catch (error) {
    console.error("Callback error:", error)
    return NextResponse.redirect(new URL("/login", request.url))
  }
}
