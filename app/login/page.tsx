import LoginForm from "@/components/auth/login-form"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined }
}) {
  // 強制ログアウトパラメータがある場合は、セッションチェックをスキップ
  const forcedLogout = searchParams?.forced_logout === "true"

  if (!forcedLogout) {
    const session = await getSession()
    const cookieStore = await cookies()

    // セッションがある場合は予定ページにリダイレクト
    if (session) {
      console.log("redirect dashboard", session)
      redirect("/dashboard/schedule")
    } else if (!session && cookieStore.get("auth_token")) {
      // セッションがない場合はauth_tokenを削除
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
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold">GROWSポータル</h1>
          <p className="mt-2 text-gray-600">Notionと連携した個人学習管理システム</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
