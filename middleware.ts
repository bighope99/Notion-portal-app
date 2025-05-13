import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get("auth_token")
  const { pathname } = request.nextUrl

  // ダッシュボードへのアクセスはログインが必要
  if (pathname.startsWith("/dashboard") && !authToken) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // ログイン済みの場合、ログインページにアクセスするとダッシュボードにリダイレクト
  if ((pathname === "/login" || pathname === "/") && authToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

// ミドルウェアを適用するパス
export const config = {
  matcher: ["/", "/login", "/dashboard/:path*"],
}
