import { NextResponse } from "next/server"
import { setupPassword, getSession } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    // セッションの確認
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // リクエストボディの解析
    const body = await request.json().catch(() => ({}))
    const { password } = body

    if (!password || password.length < 8) {
      return NextResponse.json({ success: false, error: "Password must be at least 8 characters" }, { status: 400 })
    }

    const result = await setupPassword(session.user.id, password)
    return NextResponse.json({ success: result })
  } catch (error) {
    console.error("Setup password API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
