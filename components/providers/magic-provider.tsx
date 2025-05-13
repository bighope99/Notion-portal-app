"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { isLoggedIn } from "@/lib/magic-client"

export default function MagicProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // クライアントサイドでのみ実行
    if (typeof window === "undefined") {
      setIsLoading(false)
      return
    }

    const checkAuth = async () => {
      try {
        const loggedIn = await isLoggedIn()

        // ログイン状態とURLの整合性をチェック
        if (!loggedIn && pathname?.startsWith("/dashboard")) {
          // ログインしていないのにダッシュボードにアクセスしようとした場合
          router.push("/login")
        }
      } catch (error) {
        console.error("Auth check error:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router, pathname])

  // サーバーサイドレンダリング時はローディング表示をスキップ
  if (typeof window === "undefined") {
    return <>{children}</>
  }

  if (isLoading) {
    // ローディング中の表示
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-gray-900"></div>
      </div>
    )
  }

  return <>{children}</>
}
