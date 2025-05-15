import { redirect } from "next/navigation"
import { getSession, logout } from "@/lib/auth"

export default async function DashboardPage() {
  const session = await getSession()

  if (!session) {
    // 無効なセッションを検出した場合、ログインページにリダイレクト
    // Server Actionを使用してCookieを削除
    await logout()
    redirect("/login?logout=true")
  }

  // 予定ページにリダイレクト
  redirect("/dashboard/schedule")
}
