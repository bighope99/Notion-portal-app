import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getSession()

    return NextResponse.json({
      valid: !!session,
      user: session
        ? {
            email: session.user.email,
            name: session.user.name,
          }
        : null,
    })
  } catch (error) {
    console.error("Session check error:", error)
    return NextResponse.json({ valid: false, error: "Failed to check session" }, { status: 500 })
  }
}
