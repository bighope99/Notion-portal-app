import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { getSchedules } from "@/lib/notion"
import DashboardHeader from "@/components/dashboard/dashboard-header"
import ScheduleArchiveTab from "@/components/dashboard/schedule-archive-tab"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default async function SchedulePage() {
  const session = await getSession()

  if (!session) {
    // 無効なセッションを検出した場合、ログインページにリダイレクト
    redirect("/login")
  }

  // 予定データを取得
  let scheduleData
  let fetchError = false

  try {
    scheduleData = await getSchedules()
  } catch (error) {
    console.error("Error fetching schedules:", error)
    fetchError = true
    // エラー時のフォールバックデータ
    scheduleData = {
      regularSchedules: [],
      personalConsultations: [],
      archives: [],
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <DashboardHeader name={session.user.name} />

      {fetchError && (
        <Alert variant="destructive" className="my-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            予定データの取得中にエラーが発生しました。しばらく経ってから再度お試しください。
          </AlertDescription>
        </Alert>
      )}

      <div className="mt-6">
        <ScheduleArchiveTab
          regularSchedules={scheduleData.regularSchedules}
          personalConsultations={scheduleData.personalConsultations}
          archives={scheduleData.archives}
          userEmail={session.user.email}
        />
      </div>
    </div>
  )
}
