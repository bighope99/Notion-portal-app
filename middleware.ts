import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get("auth_token")
  const { pathname } = request.nextUrl

  // ダッシュボードへのアクセスはログインが必要
  if (pathname.startsWith("/dashboard") && !authToken) {
    // ログインページにリダイレクトする際にクエリパラメータを追加して、ログアウト処理を促す
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("logout", "true")
    return NextResponse.redirect(loginUrl)
  }

  // ログイン済みの場合、ログインページにアクセスすると予定ページにリダイレクト
  if ((pathname === "/login" || pathname === "/") && authToken) {
    return NextResponse.redirect(new URL("/dashboard/schedule", request.url))
  }

  return NextResponse.next()
}

// ミドルウェアを適用するパス
export const config = {
  matcher: ["/", "/login", "/dashboard", "/dashboard/:path*"],
}
