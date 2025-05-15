import { NextResponse } from "next/server"
import { logout } from "@/lib/auth"

export async function POST() {
  try {
    // ログアウト処理
    await logout()

    // 明示的にCookieを削除するレスポンスを返す
    const response = NextResponse.json({ success: true })
    response.cookies.delete("auth_token")

    return response
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ success: false, error: "Logout failed" }, { status: 500 })
  }
}
