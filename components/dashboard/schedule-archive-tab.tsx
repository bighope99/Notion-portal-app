"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ScheduleCalendar from "@/components/dashboard/schedule-calendar"
import ArchiveList from "@/components/dashboard/archive-list"
import { useEffect, useState } from "react"
import { ExternalLink, Info } from "lucide-react"
import type { Schedule } from "@/lib/notion"
import { format, parseISO } from "date-fns"
import { ja } from "date-fns/locale"
import { Alert, AlertDescription } from "@/components/ui/alert"

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
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                  <h3 className="text-xl font-medium">個人コンサル空き枠（予約可能）</h3>

                  {/* 注意書きを追加 - PC版では横に配置 */}
                  <div className="hidden md:block">
                    <Alert variant="info" className="mt-0 bg-blue-50 border-blue-200 text-xs">
                      <Info className="h-3 w-3 text-blue-500" />
                      <AlertDescription className="text-blue-700">
                        <p className="mb-0">※面談前日までにアンケート提出必須<br />月最低1回は面談日を設けましょう（最大3回まで）</p>
                        <a
                          href="https://forms.gle/XFRC8bDdZMrC5MNk9"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 inline-flex items-center"
                        >
                          <ExternalLink className="h-2 w-2 mr-1" />
                          アンケートフォーム
                        </a>
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>

                {/* モバイル版の注意書き */}
                <div className="md:hidden mb-4">
                  <Alert variant="info" className="bg-blue-50 border-blue-200">
                    <Info className="h-4 w-4 text-blue-500" />
                    <AlertDescription className="text-blue-700">
                      <p className="mb-1">
                        ※ご予約をされた際は、<strong>必ず面談予定日の前日までに</strong>
                        アンケートフォームの送信をお願いします。
                      </p>
                      <p className="mb-1">月最低1回は面談日を設けましょう！（最大3回まで）</p>
                      <a
                        href="https://forms.gle/XFRC8bDdZMrC5MNk9"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 inline-flex items-center"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        アンケートフォームはこちら
                      </a>
                    </AlertDescription>
                  </Alert>
                </div>

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
