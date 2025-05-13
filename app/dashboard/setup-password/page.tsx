import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import PasswordSetupForm from "@/components/auth/password-setup-form"

export default async function SetupPasswordPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold">パスワードの設定</h1>
          <p className="mt-2 text-gray-600">次回からパスワードでログインできるようにします</p>
        </div>
        <PasswordSetupForm />
      </div>
    </div>
  )
}
