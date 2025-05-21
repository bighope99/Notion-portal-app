import { redirect } from "next/navigation"
import { logout } from "@/lib/auth"
import { cookies } from "next/headers"

export default async function LogoutPage() {
  // サーバーサイドでログアウト処理を実行
  try {
    await logout()

    // 確実にCookieを削除
    const cookieStore = cookies()
    cookieStore.delete("auth_token")

    // 複数の方法でCookieを削除（冗長性を持たせる）
    cookieStore.set("auth_token", "", {
      expires: new Date(0),
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 0,
    })

    // リダイレクトカウンターもリセット
    cookieStore.delete("redirect_count")

    // ログインページにリダイレクト
    redirect("/login?logged_out=true")
  } catch (error) {
    console.error("Logout error:", error)
    // エラーが発生しても、ログインページにリダイレクト
    redirect("/login?error=logout_failed")
  }

  // このコードは実行されないが、TypeScriptの型チェックのために必要
  return null
}
