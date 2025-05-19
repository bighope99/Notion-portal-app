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

  if (!session?.user.name || session.user.name.trim() === "") {
    // 空白または未定義の場合の処理
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      await fetch(`${baseUrl}/api/auth/clear-cookies`, {
        method: "GET",
        cache: "no-store",
      })
    } catch (error) {
      console.error("Failed to clear cookies:", error)
    }
  }

  const studentId = session?.user.id
  const personalPageId = session?.user.personalPageId || ""

  // 最終閲覧時間を更新
  try {
    await updateLastViewedAt(studentId || "")
  } catch (error) {
    console.error("Failed to update last viewed at:", error)
    // 非クリティカルな操作なので、エラーが発生しても続行
  }

  // データ取得のためのステート
  let tasks: any[] = []
  let submissions: any[] = []
  let student: any = null
  let fetchError: any = null
  let errorDetails = ""

  try {
    // 個人ページのリレーションIDを使用してタスクと提出物を取得
    // personalPageIdが空の場合は空の配列を使用
    const results = await Promise.allSettled([
      personalPageId ? getTasksByStudentId(personalPageId) : Promise.resolve([]),
      personalPageId ? getSubmissionsByStudentId(personalPageId) : Promise.resolve([]),
      session?.user.email ? getStudentByEmail(session.user.email) : Promise.resolve(null),
    ])

    // タスクの結果を処理
    if (results[0].status === "fulfilled") {
      tasks = results[0].value
    } else {
      console.error("Error fetching tasks:", results[0].reason)
      errorDetails += `タスク取得エラー: ${results[0].reason?.message || "不明なエラー"}\n`
      fetchError = results[0].reason
    }

    // 提出物の結果を処理
    if (results[1].status === "fulfilled") {
      submissions = results[1].value
    } else {
      console.error("Error fetching submissions:", results[1].reason)
      errorDetails += `提出物取得エラー: ${results[1].reason?.message || "不明なエラー"}\n`
      if (!fetchError) fetchError = results[1].reason
    }

    // 学生情報の結果を処理
    if (results[2].status === "fulfilled") {
      student = results[2].value
    } else {
      console.error("Error fetching student:", results[2].reason)
      errorDetails += `学生情報取得エラー: ${results[2].reason?.message || "不明なエラー"}`
      if (!fetchError) fetchError = results[2].reason
    }
  } catch (error) {
    console.error("Error in task page:", error)
    fetchError = error
    errorDetails = error instanceof Error ? error.message : "不明なエラー"
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-8">
      <DashboardHeader name={session?.user.name || "ゲスト"} />

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
