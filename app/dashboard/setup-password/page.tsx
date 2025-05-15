import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import PasswordSetupForm from "@/components/auth/password-setup-form"
import { getPasswordHashByEmail } from "@/lib/notion"

export default async function SetupPasswordPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  // パスワードが既に設定されているか確認
  const passwordHash = await getPasswordHashByEmail(session.user.email)

  // パスワードが既に設定されている場合は予定ページにリダイレクト
  if (passwordHash) {
    redirect("/dashboard/schedule")
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="w-full max-w-md">
        <PasswordSetupForm />
      </div>
    </div>
  )
}
