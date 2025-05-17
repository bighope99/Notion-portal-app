"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut, User } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { LoadingOverlay } from "@/components/ui/loading-overlay"
import { RulesDialog } from "./rules-dialog"
import { useToast } from "@/hooks/use-toast"

interface DashboardHeaderProps {
  name: string
}

export default function DashboardHeader({ name }: DashboardHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const { toast } = useToast()

  const handleLogout = async () => {
    setIsLoggingOut(true)

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      })

      if (response.ok) {
        // ログアウト成功時の処理
        toast({
          title: "ログアウト成功",
          description: "正常にログアウトしました",
        })

        // クライアントサイドでもCookieを削除 - 複数の方法を組み合わせて確実に削除
        document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=lax"
        document.cookie = "auth_token=; path=/; max-age=0; secure; samesite=lax"
        document.cookie = "redirect_count=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=lax"

        // 少し遅延を入れてからリダイレクト
        setTimeout(() => {
          // 強制的にページをリロードしてからリダイレクト
          window.location.href = "/login"
        }, 500)
      } else {
        throw new Error("ログアウトに失敗しました")
      }
    } catch (error) {
      console.error("Logout failed:", error)
      toast({
        title: "エラー",
        description: "ログアウトに失敗しました",
        variant: "destructive",
      })
      setIsLoggingOut(false)
    }
  }

  const handleNavigation = (path: string) => {
    if (pathname !== path) {
      setIsNavigating(true)
      router.push(path)
    }
  }

  return (
    <>
      {(isLoggingOut || isNavigating) && <LoadingOverlay />}
      <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">GROWSポータル</h1>
          <p className="text-gray-600">ようこそ、{name}さん</p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex space-x-2">
            <Button
              variant={pathname === "/dashboard/schedule" ? "default" : "outline"}
              size="sm"
              onClick={() => handleNavigation("/dashboard/schedule")}
            >
              予定
            </Button>
            <Button
              variant={pathname === "/dashboard/task" ? "default" : "outline"}
              size="sm"
              onClick={() => handleNavigation("/dashboard/task")}
            >
              タスク
            </Button>
            <RulesDialog />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>{isLoggingOut ? "ログアウト中..." : "ログアウト"}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </>
  )
}
