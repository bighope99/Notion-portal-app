"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { checkLoginStatus } from "@/lib/magic-client"
import { LoadingOverlay } from "@/components/ui/loading-overlay"

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
        const loggedIn = await checkLoginStatus()

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
    return <LoadingOverlay />
  }

  return <>{children}</>
}
