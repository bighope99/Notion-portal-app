"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import TaskList from "@/components/dashboard/task-list"
import SubmissionList from "@/components/dashboard/submission-list"
import type { Task, Submission } from "@/lib/notion"
import { useEffect, useState } from "react"

interface TaskSubmissionTabProps {
  tasks: Task[]
  submissions: Submission[]
  studentId: string
}

export default function TaskSubmissionTab({ tasks, submissions, studentId }: TaskSubmissionTabProps) {
  // エラーを防ぐためにクライアントサイドでのみレンダリングを行う
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>タスクと提出物</CardTitle>
          <CardDescription>読み込み中...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>タスクと提出物</CardTitle>
        <CardDescription>あなたの学習タスクと提出物を管理します</CardDescription>
      </CardHeader>
      <CardContent>
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
