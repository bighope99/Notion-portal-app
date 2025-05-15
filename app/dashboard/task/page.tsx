import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { getTasksByStudentId, getSubmissionsByStudentId, updateLastViewedAt, getStudentByEmail } from "@/lib/notion"
import DashboardHeader from "@/components/dashboard/dashboard-header"
import TaskSubmissionTab from "@/components/dashboard/task-submission-tab"
import PersonalLinks from "@/components/dashboard/personal-links"

export default async function TaskPage() {
  const session = await getSession()

  if (!session) {
    // 無効なセッションを検出した場合、ログインページにリダイレクト
    // Server Actionを使わずに単純にリダイレクト
    redirect("/login")
  }

  const studentId = session.user.id
  const personalPageId = session.user.personalPageId || ""

  // 最終閲覧時間を更新
  await updateLastViewedAt(studentId)

  // 個人ページのリレーションIDを使用してタスクと提出物を取得
  // personalPageIdが空の場合は空の配列を使用
  const [tasks, submissions] = await Promise.all([
    personalPageId ? getTasksByStudentId(personalPageId) : [],
    personalPageId ? getSubmissionsByStudentId(personalPageId) : [],
  ])

  // 学生情報を取得して個人リンクを取得
  const student = await getStudentByEmail(session.user.email)

  return (
    <div className="container mx-auto px-4 py-8">
      <DashboardHeader name={session.user.name} />

      <div className="mt-6">
        <TaskSubmissionTab tasks={tasks} submissions={submissions} studentId={personalPageId} />
      </div>

      {student && (
        <PersonalLinks
          personalLink1={student.personalLink1}
          personalLink2={student.personalLink2}
          personalLink3={student.personalLink3}
        />
      )}
    </div>
  )
}
