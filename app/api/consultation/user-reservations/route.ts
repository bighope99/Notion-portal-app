import { NextResponse } from "next/server"
import { getUserReservedSchedules } from "@/lib/notion"
import { getSession } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    // セッションの確認
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email")

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 })
    }

    // ユーザーの予約済み予定を取得
    const schedules = await getUserReservedSchedules(email)

    return NextResponse.json({ success: true, schedules })
  } catch (error) {
    console.error("Get user reservations API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
