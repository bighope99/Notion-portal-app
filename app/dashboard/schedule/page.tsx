import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { getSchedules } from "@/lib/notion"
import DashboardHeader from "@/components/dashboard/dashboard-header"
import ScheduleArchiveTab from "@/components/dashboard/schedule-archive-tab"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default async function SchedulePage() {
  const session = await getSession()

  if (!session?.user.name || session.user.name.trim() === "") {
    // 空白または未定義の場合の処理
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      })

      if (response.ok) {
        // クライアントサイドでもCookieを削除 - 複数の方法を組み合わせて確実に削除
        document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=lax"
        document.cookie = "auth_token=; path=/; max-age=0; secure; samesite=lax"
        document.cookie = "redirect_count=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=lax"

        // 少し遅延を入れてからリダイレクト
        setTimeout(() => {
          // 強制的にページをリロードしてからリダイレクト
          window.location.href = "/login"
        }, 100)
      } else {
        throw new Error("ログアウトに失敗しました")
      }
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  // 予定データを取得
  let scheduleData
  let fetchError: Error | null = null
  let errorDetails = ""

  try {
    scheduleData = await getSchedules()
  } catch (error) {
    console.error("Error fetching schedules:", error)
    fetchError = error instanceof Error ? error : null
    errorDetails = error instanceof Error ? error.message : "Unknown error"

    // エラー時のフォールバックデータ
    scheduleData = {
      regularSchedules: [],
      personalConsultations: [],
      archives: [],
    }
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-8">
      <DashboardHeader name={session?.user.name || "ゲスト"} />

      {fetchError instanceof Error && (
        <Alert variant="destructive" className="my-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            予定データの取得中にエラーが発生しました: {errorDetails}
            <br />
            しばらく経ってから再度お試しいただくか、管理者にお問い合わせください。
          </AlertDescription>
        </Alert>
      )}

      <div className="mt-6">
        <ScheduleArchiveTab
          regularSchedules={scheduleData.regularSchedules}
          personalConsultations={scheduleData.personalConsultations}
          archives={scheduleData.archives}
          userEmail={session?.user.email || ""}
        />
      </div>
    </div>
  )
}
