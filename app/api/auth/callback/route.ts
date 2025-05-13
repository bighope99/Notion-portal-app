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
      // パスワードが設定されていない場合、またはパスワードリセットの場合は、パスワード設定ページにリダイレクト
      if (!result.hasPassword || isReset) {
        return NextResponse.redirect(new URL("/dashboard/setup-password", request.url))
      }
      return NextResponse.redirect(new URL("/dashboard", request.url))
    } else {
      return NextResponse.redirect(new URL("/login", request.url))
    }
  } catch (error) {
    console.error("Callback error:", error)
    return NextResponse.redirect(new URL("/login", request.url))
  }
}
