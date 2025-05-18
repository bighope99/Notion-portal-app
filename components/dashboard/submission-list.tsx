"use client"

import type React from "react"

import { useState } from "react"
import { type Submission, addSubmission } from "@/lib/notion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PlusCircle, ExternalLink, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface SubmissionListProps {
  submissions: Submission[]
  studentId: string
}

export default function SubmissionList({ submissions: initialSubmissions, studentId }: SubmissionListProps) {
  const [submissions, setSubmissions] = useState<Submission[]>(initialSubmissions)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  // studentIdが有効なIDかどうかをチェック（簡易的なチェック）
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  const isValidStudentId = studentId && uuidRegex.test(studentId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (!isValidStudentId) {
        throw new Error("学生IDが無効です")
      }

      // URLのバリデーション
      let validUrl = url
      try {
        // URLが有効かチェック
        new URL(url)
      } catch (error) {
        // URLが無効な場合、httpをつけて再試行
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
          validUrl = `https://${url}`
          try {
            new URL(validUrl)
          } catch (error) {
            throw new Error("無効なURLです")
          }
        } else {
          throw new Error("無効なURLです")
        }
      }

      const success = await addSubmission(studentId, title, validUrl)

      if (success) {
        const newSubmission: Submission = {
          id: Date.now().toString(), // 一時的なID
          name: title,
          studentId,
          url: validUrl,
          submittedAt: new Date().toISOString(),
        }

        setSubmissions([newSubmission, ...submissions])
        setTitle("")
        setUrl("")
        setIsDialogOpen(false)

        toast({
          title: "提出完了",
          description: "課題が提出されました",
        })
      } else {
        throw new Error("Failed to add submission")
      }
    } catch (error) {
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "課題の提出に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <div className="flex items-center mb-2">
          <a
            href="https://forms.gle/7xL6afY8i2bZpMiG6"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            月次報告フォーム
          </a>
        </div>
        <p className="text-sm text-gray-700">
          ※毎月10日まで前月のリピート率スプレッドシートの入力と共に、フォームを入力・送信してください
        </p>
      </div>
      <div className="flex justify-end mb-4">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              課題を提出
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>課題の提出</DialogTitle>
              <DialogDescription>課題のタイトルとURLを入力してください</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">タイトル</Label>
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://"
                    required
                  />
                  <p className="text-xs text-gray-500">例: https://example.com/my-submission</p>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "提出中..." : "提出する"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {!isValidStudentId && (
        <Alert variant="warning" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>学生IDが無効なため、提出物の追加ができません。</AlertDescription>
        </Alert>
      )}

      {submissions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">提出された課題はありません</div>
      ) : (
        <div className="space-y-4">
          {submissions.map((submission) => (
            <div
              key={submission.id}
              className="flex items-start justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div>
                <h3 className="font-medium">{submission.name}</h3>
                {submission.submittedAt && (
                  <p className="text-xs text-gray-500 mt-1">
                    提出日: {format(new Date(submission.submittedAt), "yyyy年MM月dd日", { locale: ja })}
                  </p>
                )}
              </div>
              {submission.url && (
                <a
                  href={submission.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  開く
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
