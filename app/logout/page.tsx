"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { LogOut } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function LogoutPage() {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // 自動ログアウトを防ぐために、ページロード時にはログアウト処理を行わない
  const handleLogout = async () => {
    setIsLoggingOut(true)
    setError(null)

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      })

      if (response.ok) {
        // クライアントサイドでもCookieを削除 - 複数の方法を組み合わせて確実に削除
        document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=lax"
        document.cookie = "auth_token=; path=/; max-age=0; secure; samesite=lax"
        document.cookie = "redirect_count=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=lax"

        // 少し遅延を入れてからリダイレクト
        setTimeout(() => {
          // 強制的にページをリロードしてからリダイレクト
          window.location.href = "/login?logged_out=true"
        }, 500)
      } else {
        throw new Error("ログアウトに失敗しました")
      }
    } catch (error) {
      console.error("Logout failed:", error)
      setError(error instanceof Error ? error.message : "ログアウト処理中にエラーが発生しました")
      setIsLoggingOut(false)
    }
  }

  // キャンセルボタンの処理
  const handleCancel = () => {
    router.push("/dashboard/schedule")
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-red-100 p-3">
              <LogOut className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-center">ログアウト</CardTitle>
          <CardDescription className="text-center">GROWSポータルからログアウトします</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
          <p className="text-center mb-4">本当にログアウトしますか？</p>
          {isLoggingOut && (
            <div className="flex justify-center my-4">
              <LoadingSpinner size={24} className="text-blue-600" />
              <span className="ml-2">ログアウト中...</span>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleCancel} disabled={isLoggingOut}>
            キャンセル
          </Button>
          <Button variant="destructive" onClick={handleLogout} disabled={isLoggingOut}>
            ログアウト
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
