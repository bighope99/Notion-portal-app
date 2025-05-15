import { redirect } from "next/navigation"
import { getSession, logout } from "@/lib/auth"
import { getSchedules } from "@/lib/notion"
import DashboardHeader from "@/components/dashboard/dashboard-header"
import ScheduleArchiveTab from "@/components/dashboard/schedule-archive-tab"

export default async function SchedulePage() {
  const session = await getSession()

  if (!session) {
    // 無効なセッションを検出した場合、ログインページにリダイレクト
    // Server Actionを使用してCookieを削除
    await logout()
    redirect("/login?logout=true")
  }

  // 予定データを取得
  const scheduleData = await getSchedules()

  return (
    <div className="container mx-auto px-4 py-8">
      <DashboardHeader name={session.user.name} />

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
