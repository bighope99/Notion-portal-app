import { NextResponse } from "next/server"
import { loginWithPassword } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    // リクエストボディの解析
    const body = await request.json().catch(() => ({}))
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email and password are required" }, { status: 400 })
    }

    const result = await loginWithPassword(email, password)
    return NextResponse.json(result)
  } catch (error) {
    console.error("Password login API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
