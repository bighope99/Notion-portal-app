import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"

export default async function DashboardPage() {
  const session = await getSession()

  if (!session) {
    // 無効なセッションを検出した場合、ログインページにリダイレクト
    redirect("/login")
  }

  // 予定ページにリダイレクト
  redirect("/dashboard/schedule")
}
