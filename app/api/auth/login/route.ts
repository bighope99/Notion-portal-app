import { NextResponse } from "next/server"
import { login } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 })
    }

    const result = await login(email)

    // エラーがあっても200 OKを返す（セキュリティのため）
    return NextResponse.json({ success: result.success })
  } catch (error) {
    console.error("Login error:", error)
    // エラーがあっても200 OKを返す（セキュリティのため）
    return NextResponse.json({ success: false })
  }
}
