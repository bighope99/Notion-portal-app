"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import TaskList from "@/components/dashboard/task-list"
import SubmissionList from "@/components/dashboard/submission-list"
import type { Task, Submission } from "@/lib/notion"
import { useEffect, useState } from "react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface TaskSubmissionTabProps {
  tasks: Task[]
  submissions: Submission[]
  studentId: string
}

export default function TaskSubmissionTab({ tasks, submissions, studentId }: TaskSubmissionTabProps) {
  // エラーを防ぐためにクライアントサイドでのみレンダリングを行う
  const [isClient, setIsClient] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsClient(true)
    // データが読み込まれたらローディング状態を解除
    setIsLoading(false)
  }, [])

  if (!isClient || isLoading) {
    return (
      <Card className="border-0 shadow-none">
        <CardHeader className="px-0 sm:px-2">
          <CardTitle>タスクと提出物</CardTitle>
          <CardDescription>読み込み中...</CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-2">
          <div className="flex justify-center py-8">
            <LoadingSpinner size={24} className="text-blue-600" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="px-0 sm:px-2">
        <CardTitle>タスクと提出物</CardTitle>
        <CardDescription>あなたの学習タスクと提出物を管理します</CardDescription>
      </CardHeader>
      <CardContent className="p-0 sm:p-2">
        <Tabs defaultValue="tasks" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tasks">タスク</TabsTrigger>
            <TabsTrigger value="submissions">提出物</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="mt-4">
            <TaskList tasks={tasks} />
          </TabsContent>

          <TabsContent value="submissions" className="mt-4">
            <SubmissionList submissions={submissions} studentId={studentId} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
