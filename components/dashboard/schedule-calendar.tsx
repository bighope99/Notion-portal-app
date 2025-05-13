"use client"

import { useState } from "react"
import type { Schedule } from "@/lib/notion"
import { Calendar } from "@/components/ui/calendar"
import { ja } from "date-fns/locale"
import { format, isSameDay } from "date-fns"
import { Button } from "@/components/ui/button"
import { CalendarIcon, X, ExternalLink } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface ScheduleCalendarProps {
  schedules: Schedule[]
}

export default function ScheduleCalendar({ schedules }: ScheduleCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // 選択された日付のスケジュールを取得
  const getSchedulesForDate = (date: Date) => {
    return schedules.filter((schedule) => isSameDay(new Date(schedule.date), date))
  }

  // 日付に予定があるかどうかを確認
  const hasScheduleOnDate = (date: Date) => {
    return schedules.some((schedule) => isSameDay(new Date(schedule.date), date))
  }

  // 日付がクリックされたときの処理
  const handleDateClick = (date: Date | undefined) => {
    if (date && hasScheduleOnDate(date)) {
      setSelectedDate(date)
      setIsDialogOpen(true)
    }
  }

  return (
    <div>
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={handleDateClick}
        locale={ja}
        className="rounded-md border"
        modifiers={{
          hasSchedule: (date) => hasScheduleOnDate(date),
        }}
        modifiersStyles={{
          hasSchedule: { backgroundColor: "#e0f2fe", fontWeight: "bold" },
        }}
        components={{
          DayContent: (props) => {
            const hasSchedule = hasScheduleOnDate(props.date)
            return (
              <div className="relative w-full h-full flex items-center justify-center">
                {props.date.getDate()}
                {hasSchedule && (
                  <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full" />
                )}
              </div>
            )
          },
        }}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate && format(selectedDate, "yyyy年MM月dd日", { locale: ja })}の予定
            </DialogTitle>
            <DialogDescription>この日の予定一覧</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto py-4">
            {selectedDate &&
              getSchedulesForDate(selectedDate).map((schedule) => (
                <div key={schedule.id} className="p-4 rounded-lg border border-gray-200">
                  <h3 className="font-medium">{schedule.name}</h3>

                  {schedule.theme && <p className="text-sm text-gray-600 mt-1">テーマ: {schedule.theme}</p>}

                  {schedule.instructor && <p className="text-sm text-gray-600 mt-1">講師: {schedule.instructor}</p>}

                  <div className="mt-4 space-y-2">
                    {schedule.url && (
                      <a
                        href={schedule.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        {schedule.isArchive ? "アーカイブを見る" : "ミーティングに参加"}
                      </a>
                    )}

                    {schedule.password && (
                      <p className="text-sm">
                        パスワード: <span className="font-mono">{schedule.password}</span>
                      </p>
                    )}
                  </div>
                </div>
              ))}
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              <X className="mr-2 h-4 w-4" />
              閉じる
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
