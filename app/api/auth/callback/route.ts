import { NextResponse } from "next/server"
import { handleCallback } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const token = url.searchParams.get("token")

    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    const result = await handleCallback(token)

    if (result.success) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    } else {
      return NextResponse.redirect(new URL("/login", request.url))
    }
  } catch (error) {
    console.error("Callback error:", error)
    return NextResponse.redirect(new URL("/login", request.url))
  }
}
