import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get("auth_token")
  const { pathname } = request.nextUrl

  // セッションの状態をチェックするためのフラグ
  const sessionCheckNeeded = authToken && (pathname === "/" || pathname.startsWith("/dashboard"))

  // セッションチェックが必要な場合は、APIエンドポイントにリダイレクト
  if (sessionCheckNeeded) {
    // セッションチェック用のAPIにリダイレクト
    // このAPIはセッションの有効性を確認し、無効な場合はログアウト処理を行う
    return NextResponse.redirect(
      new URL(`/api/auth/validate-session?redirect=${encodeURIComponent(pathname)}`, request.url),
    )
  }

  // ダッシュボードへのアクセスはログインが必要
  if (pathname.startsWith("/dashboard") && !authToken) {
    return NextResponse.redirect(new URL("/login", request.url))
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
