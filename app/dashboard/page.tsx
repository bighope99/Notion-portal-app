import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth"
import { getTasksByPersonalPage, getSubmissionsByPersonalPage, getSchedules, updateLastViewedAt } from "@/lib/notion"
import DashboardHeader from "@/components/dashboard/dashboard-header"
import TaskList from "@/components/dashboard/task-list"
import SubmissionList from "@/components/dashboard/submission-list"
import ScheduleCalendar from "@/components/dashboard/schedule-calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function DashboardPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  const studentId = session.user.id
  const personalPage = session.user.personalPage

  // 最終閲覧時間を更新
  await updateLastViewedAt(studentId)

  const [tasks, submissions, schedules] = await Promise.all([
    getTasksByPersonalPage(personalPage),
    getSubmissionsByPersonalPage(personalPage),
    getSchedules(),
  ])

  return (
    <div className="container mx-auto px-4 py-8">
      <DashboardHeader name={session.user.name} />

      <Tabs defaultValue="tasks" className="mt-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tasks">タスク</TabsTrigger>
          <TabsTrigger value="submissions">提出物</TabsTrigger>
          <TabsTrigger value="schedule">予定</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>学習タスク</CardTitle>
              <CardDescription>あなたの学習タスクと進捗状況</CardDescription>
            </CardHeader>
            <CardContent>
              <TaskList tasks={tasks} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="submissions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>提出物管理</CardTitle>
              <CardDescription>課題の提出と提出履歴</CardDescription>
            </CardHeader>
            <CardContent>
              <SubmissionList submissions={submissions} personalPage={personalPage} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>予定管理</CardTitle>
              <CardDescription>セミナーやコンサルテーションの予定</CardDescription>
            </CardHeader>
            <CardContent>
              <ScheduleCalendar schedules={schedules} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
