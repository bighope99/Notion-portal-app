import { NextResponse } from "next/server"
import { reserveConsultation } from "@/lib/notion"
import { getSession } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    // セッションの確認
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // リクエストボディの解析
    const body = await request.json().catch(() => ({}))
    const { scheduleId } = body

    if (!scheduleId) {
      return NextResponse.json({ success: false, error: "Schedule ID is required" }, { status: 400 })
    }

    // 予約処理
    const success = await reserveConsultation(scheduleId, session.user.name, session.user.email)

    if (success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ success: false, error: "Failed to reserve consultation" }, { status: 500 })
    }
  } catch (error) {
    console.error("Reserve consultation API error:", error)
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 })
  }
}
