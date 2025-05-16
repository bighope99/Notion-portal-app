import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { getTasksByStudentId, getSubmissionsByStudentId, updateLastViewedAt, getStudentByEmail } from "@/lib/notion"
import DashboardHeader from "@/components/dashboard/dashboard-header"
import TaskSubmissionTab from "@/components/dashboard/task-submission-tab"
import PersonalLinks from "@/components/dashboard/personal-links"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Suspense } from "react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default async function TaskPage() {
  const session = await getSession()

  if (!session) {
    // 無効なセッションを検出した場合、ログインページにリダイレクト
    redirect("/login")
  }

  const studentId = session.user.id
  const personalPageId = session.user.personalPageId || ""

  // 最終閲覧時間を更新
  try {
    await updateLastViewedAt(studentId)
  } catch (error) {
    console.error("Failed to update last viewed at:", error)
    // 非クリティカルな操作なので、エラーが発生しても続行
  }

  // データ取得のためのステート
  let tasks = []
  let submissions = []
  let student = null
  let fetchError = null
  let errorDetails = ""

  try {
    // 個人ページのリレーションIDを使用してタスクと提出物を取得
    // personalPageIdが空の場合は空の配列を使用
    console.log("Starting data fetch with personalPageId:", personalPageId)

    // 各データ取得を個別に実行し、エラーハンドリングを強化
    try {
      if (personalPageId) {
        tasks = await getTasksByStudentId(personalPageId)
        console.log(`Successfully fetched ${tasks.length} tasks`)
      } else {
        console.log("No personalPageId, skipping tasks fetch")
      }
    } catch (taskError) {
      console.error("Error fetching tasks:", taskError)
      errorDetails += `タスク取得エラー: ${taskError instanceof Error ? taskError.message : "不明なエラー"}\n`
      fetchError = taskError
      tasks = [] // エラー時は空配列を使用
    }

    try {
      if (personalPageId) {
        submissions = await getSubmissionsByStudentId(personalPageId)
        console.log(`Successfully fetched ${submissions.length} submissions`)
      } else {
        console.log("No personalPageId, skipping submissions fetch")
      }
    } catch (submissionError) {
      console.error("Error fetching submissions:", submissionError)
      errorDetails += `提出物取得エラー: ${submissionError instanceof Error ? submissionError.message : "不明なエラー"}\n`
      if (!fetchError) fetchError = submissionError
      submissions = [] // エラー時は空配列を使用
    }

    try {
      student = await getStudentByEmail(session.user.email)
      console.log("Successfully fetched student data")
    } catch (studentError) {
      console.error("Error fetching student:", studentError)
      errorDetails += `学生情報取得エラー: ${studentError instanceof Error ? studentError.message : "不明なエラー"}`
      if (!fetchError) fetchError = studentError
      student = null // エラー時はnullを使用
    }
  } catch (error) {
    console.error("Error in task page:", error)
    fetchError = error
    errorDetails = error instanceof Error ? error.message : "不明なエラー"
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-8">
      <DashboardHeader name={session.user.name} />

      {fetchError && (
        <Alert variant="destructive" className="my-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            データの取得中にエラーが発生しました: {errorDetails}
            <br />
            しばらく経ってから再度お試しいただくか、管理者にお問い合わせください。
          </AlertDescription>
        </Alert>
      )}

      {/* 個人リンクをタスクと提出物のタブの上に配置 */}
      <Suspense
        fallback={
          <div className="flex justify-center py-4">
            <LoadingSpinner />
          </div>
        }
      >
        {student && (
          <PersonalLinks
            personalLink1={student.personalLink1}
            personalLink2={student.personalLink2}
            personalLink3={student.personalLink3}
            linkName1={student.linkName1}
            linkName2={student.linkName2}
            linkName3={student.linkName3}
          />
        )}
      </Suspense>

      <div className="mt-0">
        <Suspense
          fallback={
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          }
        >
          <TaskSubmissionTab tasks={tasks} submissions={submissions} studentId={personalPageId} />
        </Suspense>
      </div>
    </div>
  )
}
