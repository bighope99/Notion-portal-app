import { NextResponse } from "next/server"
import { login } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    // リクエストボディの解析
    const body = await request.json().catch(() => ({}))
    const { email } = body

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 })
    }

    // パスワードリセット用のマジックリンクを送信
    const result = await login(email, true)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Forgot password API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
