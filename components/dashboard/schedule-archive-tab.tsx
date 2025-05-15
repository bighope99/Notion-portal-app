"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ScheduleCalendar from "@/components/dashboard/schedule-calendar"
import ArchiveList from "@/components/dashboard/archive-list"
import { useEffect, useState } from "react"
import { ExternalLink } from "lucide-react"
import type { Schedule } from "@/lib/notion"
import { format, parseISO } from "date-fns"
import { ja } from "date-fns/locale"

interface ScheduleArchiveTabProps {
  regularSchedules: Schedule[]
  personalConsultations: Schedule[]
  archives: Schedule[]
  userEmail: string
}

export default function ScheduleArchiveTab({
  regularSchedules,
  personalConsultations,
  archives,
  userEmail,
}: ScheduleArchiveTabProps) {
  const [userReservedSchedules, setUserReservedSchedules] = useState<Schedule[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // ユーザーの予約済み予定を取得
  useEffect(() => {
    const fetchUserReservedSchedules = async () => {
      try {
        const response = await fetch(`/api/consultation/user-reservations?email=${encodeURIComponent(userEmail)}`)
        if (response.ok) {
          const data = await response.json()
          setUserReservedSchedules(data.schedules || [])
        }
      } catch (error) {
        console.error("Failed to fetch user reservations:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (userEmail) {
      fetchUserReservedSchedules()
    } else {
      setIsLoading(false)
    }
  }, [userEmail])

  return (
    <Card>
      <CardHeader>
        <CardTitle>予定とアーカイブ</CardTitle>
        <CardDescription>セミナーや個人コンサル枠の予定とアーカイブを確認します</CardDescription>
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
                <h3 className="text-xl font-medium mb-2">セミナー・イベント</h3>
                <div className="w-full overflow-x-auto">
                  <ScheduleCalendar schedules={regularSchedules} />
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-xl font-medium mb-2">個人コンサル空き枠（予約可能）</h3>
                {/* 予約済み予定の表示 */}
                {userReservedSchedules.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-600 mb-2">あなたの予約済み予定</h4>
                    <div className="space-y-2">
                      {userReservedSchedules.map((schedule) => (
                        <div key={schedule.id} className="p-2 rounded-md bg-purple-50 border border-purple-100 text-sm">
                          <div className="font-medium">{schedule.name}</div>
                          <div className="text-xs text-gray-600">
                            {schedule.dateRange?.start &&
                              format(parseISO(schedule.dateRange.start), "yyyy年MM月dd日 HH:mm", { locale: ja })}
                            {schedule.instructor && ` (講師: ${schedule.instructor})`}
                          </div>
                          {schedule.url && (
                            <a
                              href={schedule.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-blue-600 hover:text-blue-800 text-xs mt-1"
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              ミーティングに参加
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
