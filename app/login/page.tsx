import LoginForm from "@/components/auth/login-form"
import { getSession, logout } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const session = await getSession()

  // ログアウトパラメータがある場合、強制的にログアウト処理を実行
  if (searchParams.logout === "true") {
    await logout()
    // ログアウト後にセッションを再確認
    const sessionAfterLogout = await getSession()
    if (sessionAfterLogout) {
      // それでもセッションが残っている場合は、Cookieの問題かもしれないので
      // クライアントサイドでのリダイレクトを使用
      return (
        <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="w-full max-w-md">
            <div className="text-center mb-10">
              <h1 className="text-3xl font-bold">GROWSポータル</h1>
              <p className="mt-2 text-gray-600">セッションをクリアしています...</p>
            </div>
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
                  window.location.href = "/login";
                `,
              }}
            />
          </div>
        </div>
      )
    }
  }

  // 通常のセッションチェック
  if (session) {
    redirect("/dashboard/schedule")
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
