import { NextResponse } from "next/server"
import { logout } from "@/lib/auth"

export async function POST() {
  try {
    // ログアウト処理
    await logout()

    // 明示的にCookieを削除するレスポンスを返す
    const response = NextResponse.json({ success: true })
    response.cookies.delete("auth_token", {
      path: "/",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 0,
      expires: new Date(0),
    })

    return response
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ success: false, error: "Logout failed" }, { status: 500 })
  }
}
