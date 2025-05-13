"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import TaskList from "@/components/dashboard/task-list"
import SubmissionList from "@/components/dashboard/submission-list"
import type { Task, Submission } from "@/lib/notion"

interface TaskSubmissionTabProps {
  tasks: Task[]
  submissions: Submission[]
  studentId: string
}

export default function TaskSubmissionTab({ tasks, submissions, studentId }: TaskSubmissionTabProps) {
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
