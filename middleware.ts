import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get("auth_token")
  const { pathname } = request.nextUrl

  // リダイレクトループ検出のためのカウンターを取得
  const redirectCount = Number.parseInt(request.cookies.get("redirect_count")?.value || "0")

  // リダイレクトループの検出（3回以上のリダイレクトで強制ログアウト）
  if (redirectCount >= 3) {
    console.warn("Redirect loop detected! Forcing logout...")

    // 強制ログアウト用のレスポンスを作成
    const response = NextResponse.redirect(new URL("/api/auth/force-logout", request.url))

    // リダイレクトカウンターをリセット
    response.cookies.set("redirect_count", "0", {
      path: "/",
      maxAge: 60, // 1分間だけ有効
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    })

    return response
  }

  // パスワード設定ページへのアクセスは特別に処理
  // セッションチェックをスキップして、APIで検証する
  if (pathname === "/dashboard/setup-password") {
    // パスワード設定ページはauth_tokenがあれば許可（セッション検証はページ内で行う）
    if (!authToken) {
      console.log("パスワード設定ページへのアクセスはauth_tokenがあれば許可")
      const response = NextResponse.redirect(new URL("/login", request.url))
      response.cookies.set("redirect_count", String(redirectCount + 1), {
        path: "/",
        maxAge: 60,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      })
      return response
    }
    return NextResponse.next()
  }

  // ダッシュボードへのアクセスはログインが必要
  if (pathname.startsWith("/dashboard") && !authToken) {
    // リダイレクトカウンターをインクリメント
    console.log("ダッシュボードへのアクセスはログインが必要", authToken)
    const response = NextResponse.redirect(new URL("/login", request.url))

    // auth_tokenクッキーを確実に削除
    response.cookies.delete("auth_token")
    response.cookies.set("redirect_count", String(redirectCount + 1), {
      path: "/",
      maxAge: 60, // 1分間だけ有効
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    })
    return response
  }

  // ログイン済みの場合、ログインページにアクセスすると予定ページにリダイレクト
  if ((pathname === "/login" || pathname === "/") && authToken) {
    // リダイレクトカウンターをインクリメント
    const response = NextResponse.redirect(new URL("/dashboard/schedule", request.url))
    console.log("リダイレクトカウンターをインクリメント", redirectCount)
    response.cookies.set("redirect_count", String(redirectCount + 1), {
      path: "/",
      maxAge: 60, // 1分間だけ有効
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    })
    return response
  }

  // 通常のナビゲーションの場合はリダイレクトカウンターをリセット
  if (!pathname.startsWith("/api/")) {
    const response = NextResponse.next()
    response.cookies.set("redirect_count", "0", {
      path: "/",
      maxAge: 60, // 1分間だけ有効
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    })
    return response
  }

  return NextResponse.next()
}

// ミドルウェアを適用するパス
export const config = {
  matcher: ["/", "/login", "/dashboard", "/dashboard/:path*"],
}
