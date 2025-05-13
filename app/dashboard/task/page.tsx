import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { getTasksByStudentId, getSubmissionsByStudentId, updateLastViewedAt } from "@/lib/notion"
import DashboardHeader from "@/components/dashboard/dashboard-header"
import TaskSubmissionTab from "@/components/dashboard/task-submission-tab"

export default async function TaskPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  const studentId = session.user.id
  const personalPageId = session.user.personalPageId || ""

  // personalPageIdの値をログに出力（デバッグ用）
  console.log(`Dashboard Task: personalPageId = "${personalPageId}"`)

  // 最終閲覧時間を更新
  await updateLastViewedAt(studentId)

  // 個人ページのリレーションIDを使用してタスクと提出物を取得
  // personalPageIdが空の場合は空の配列を使用
  const [tasks, submissions] = await Promise.all([
    personalPageId ? getTasksByStudentId(personalPageId) : [],
    personalPageId ? getSubmissionsByStudentId(personalPageId) : [],
  ])

  return (
    <div className="container mx-auto px-4 py-8">
      <DashboardHeader name={session.user.name} />

      <div className="mt-6">
        <TaskSubmissionTab tasks={tasks} submissions={submissions} studentId={personalPageId} />
      </div>
    </div>
  )
}
