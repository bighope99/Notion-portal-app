"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LoadingOverlay } from "@/components/ui/loading-overlay"

export default function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  // URLパラメータからエラー状態を取得
  const sessionInvalid = searchParams.get("session_invalid") === "true"
  const validationError = searchParams.get("error") === "session_validation_failed"
  const forcedLogout = searchParams.get("forced_logout") === "true"

  // ページロード時に状態をチェック
  useEffect(() => {
    // セッション無効のメッセージを表示
    if (sessionInvalid) {
      setError("セッションが無効になりました。再度ログインしてください。")
    } else if (validationError) {
      setError("セッションの検証中にエラーが発生しました。再度ログインしてください。")
    } else if (forcedLogout) {
      setError("セッションに問題が発生したため、自動的にログアウトしました。再度ログインしてください。")
    }

    // クライアントサイドでCookieをクリア
    const clearCookies = () => {
      document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=lax"
      document.cookie = "redirect_count=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=lax"
    }

    // セッション関連のエラーがある場合は、確実にCookieをクリア
    if (sessionInvalid || validationError || forcedLogout) {
      clearCookies()
    }
  }, [sessionInvalid, validationError, forcedLogout])

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        throw new Error(`サーバーエラー: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        // ログイン成功時はチェックメールページにリダイレクト
        router.push("/login/check-email")
      } else {
        throw new Error(
          data.error === "user_not_found" ? "登録されていないメールアドレスです" : "ログインに失敗しました",
        )
      }
    } catch (err: any) {
      console.error("Login error:", err)
      setError(err.message || "ログインに失敗しました。メールアドレスを確認してください。")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/auth/password-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        throw new Error(`サーバーエラー: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        // ログイン成功時は予定ページにリダイレクト
        router.push("/dashboard/schedule")
        router.refresh() // セッション状態を更新
      } else {
        if (data.error === "user_not_found") {
          throw new Error("登録されていないメールアドレスです")
        } else if (data.error === "invalid_password") {
          throw new Error("メールアドレスまたはパスワードが正しくありません")
        } else {
          throw new Error("ログインに失敗しました。入力情報を確認してください")
        }
      }
    } catch (err: any) {
      console.error("Password login error:", err)
      setError(err.message || "ログインに失敗しました。メールアドレスとパスワードを確認してください。")
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email) {
      setError("パスワードをリセットするには、メールアドレスを入力してください")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        throw new Error(`サーバーエラー: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        // パスワードリセットメール送信成功時はチェックメールページにリダイレクト
        router.push("/login/check-email")
      } else {
        throw new Error(
          data.error === "user_not_found" ? "登録されていないメールアドレスです" : "パスワードリセットに失敗しました",
        )
      }
    } catch (err: any) {
      console.error("Forgot password error:", err)
      setError(err.message || "パスワードリセットに失敗しました。メールアドレスを確認してください。")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {isLoading && <LoadingOverlay />}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>ログイン</CardTitle>
          <CardDescription>学習ポータルにログインします</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Tabs defaultValue="password" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="password">ログイン</TabsTrigger>
              <TabsTrigger value="magic">初めての方</TabsTrigger>
            </TabsList>
            <TabsContent value="password">
              <form onSubmit={handlePasswordSubmit} className="space-y-4 mt-4">
                <div className="grid gap-2">
                  <Label htmlFor="email-password">メールアドレス</Label>
                  <Input
                    id="email-password"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full"
                    disabled={isLoading}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">パスワード</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full"
                    disabled={isLoading}
                  />
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-xs text-blue-600 hover:text-blue-800"
                      disabled={isLoading}
                    >
                      パスワードをお忘れの方はこちら
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "ログイン中..." : "ログイン"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="magic">
              <form onSubmit={handleMagicLinkSubmit} className="space-y-4 mt-4">
                <div className="grid gap-2">
                  <Label htmlFor="email-magic">メールアドレス</Label>
                  <Input
                    id="email-magic"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full"
                    disabled={isLoading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "送信中..." : "認証メールを送信"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </>
  )
}
