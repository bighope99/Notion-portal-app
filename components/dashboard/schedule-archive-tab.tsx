"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ScheduleCalendar from "@/components/dashboard/schedule-calendar"
import ArchiveList from "@/components/dashboard/archive-list"
import type { Schedule } from "@/lib/notion"

interface ScheduleArchiveTabProps {
  regularSchedules: Schedule[]
  personalConsultations: Schedule[]
  archives: Schedule[]
}

export default function ScheduleArchiveTab({
  regularSchedules,
  personalConsultations,
  archives,
}: ScheduleArchiveTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>予定とアーカイブ</CardTitle>
        <CardDescription>セミナーやコンサルテーションの予定とアーカイブを確認します</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="schedules" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="schedules">予定</TabsTrigger>
            <TabsTrigger value="archives">アーカイブ</TabsTrigger>
          </TabsList>

          <TabsContent value="schedules" className="mt-4">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">セミナー・イベント</h3>
                <div className="w-full overflow-x-auto">
                  <ScheduleCalendar schedules={regularSchedules} />
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-medium mb-2">個人コンサルテーション（予約可能）</h3>
                <div className="w-full overflow-x-auto">
                  <ScheduleCalendar schedules={personalConsultations} />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="archives" className="mt-4">
            <ArchiveList archives={archives} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
