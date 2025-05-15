"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle, Lock } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function PasswordSetupForm() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean>(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    // パスワードの検証
    if (password.length < 8) {
      setError("パスワードは8文字以上で入力してください")
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError("パスワードが一致しません")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/setup-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      })

      if (!response.ok) {
        throw new Error(`サーバーエラー: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        // 2秒後に予定ページにリダイレクト
        setTimeout(() => {
          router.push("/dashboard/schedule")
          // 強制的にページをリロード（キャッシュをクリア）
          window.location.href = "/dashboard/schedule"
        }, 2000)
      } else {
        throw new Error(data.error || "パスワードの設定に失敗しました")
      }
    } catch (err: any) {
      console.error("Password setup error:", err)
      setError(err.message || "パスワードの設定に失敗しました")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-blue-100 p-3">
            <Lock className="h-6 w-6 text-blue-600" />
          </div>
        </div>
        <CardTitle className="text-center">パスワードの設定</CardTitle>
        <CardDescription className="text-center">次回からパスワードでログインできるようにします</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-700">
                パスワードが設定されました。予定ページにリダイレクトします...
              </AlertDescription>
            </Alert>
          )}
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full"
              />
              <p className="text-xs text-gray-500">8文字以上で入力してください</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">パスワード（確認）</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading || success}>
            {isLoading ? "設定中..." : "パスワードを設定"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
