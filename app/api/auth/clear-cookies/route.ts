import { NextResponse } from "next/server"

export async function GET() {
  try {
    // ログインページにリダイレクト
    const response = NextResponse.redirect(
      new URL("/login", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
    )

    // 複数の方法を組み合わせて確実にクッキーを削除
    // 方法1: 削除
    response.cookies.delete("auth_token", {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    })

    // 方法2: 期限切れの空の値を設定
    response.cookies.set("auth_token", "", {
      expires: new Date(0),
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 0,
    })

    // リダイレクトカウンターもリセット
    response.cookies.delete("redirect_count", {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    })

    return response
  } catch (error) {
    console.error("Clear cookies error:", error)

    // エラーが発生しても、ログインページにリダイレクト
    const response = NextResponse.redirect(
      new URL("/login", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
    )

    // 同様にクッキーを削除
    response.cookies.delete("auth_token", {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    })

    response.cookies.set("auth_token", "", {
      expires: new Date(0),
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 0,
    })

    return response
  }
}
