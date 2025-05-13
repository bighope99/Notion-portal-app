"use client"

import { useState, useEffect } from "react"
import type { Schedule, DateRange } from "@/lib/notion"
import { Calendar } from "@/components/ui/calendar"
import { ja } from "date-fns/locale"
import { format, isSameDay, parseISO } from "date-fns"
import { Button } from "@/components/ui/button"
import { CalendarIcon, X, ExternalLink, User, Tag, Clock } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ScheduleCalendarProps {
  schedules: Schedule[]
}

// 日付範囲から時間部分のみを抽出する関数
function formatTimeRange(dateRange: DateRange): string {
  if (!dateRange || !dateRange.start) return ""

  try {
    const startDate = parseISO(dateRange.start)
    const startTime = format(startDate, "HH:mm")

    if (dateRange.end) {
      const endDate = parseISO(dateRange.end)
      const endTime = format(endDate, "HH:mm")
      return `${startTime} - ${endTime}`
    }

    return startTime
  } catch (error) {
    console.error("Error formatting time range:", error)
    return ""
  }
}

export default function ScheduleCalendar({ schedules }: ScheduleCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null)
  const [isReservationDialogOpen, setIsReservationDialogOpen] = useState(false)
  const [isReserving, setIsReserving] = useState(false)
  const { toast } = useToast()

  // デバッグ用：スケジュールデータをコンソールに表示
  useEffect(() => {
    console.log("Schedule data in calendar component:", schedules)
    // 各予定の講義テーマと時間範囲をコンソールに表示
    schedules.forEach((schedule) => {
      console.log(`Schedule "${schedule.name}":`)
      console.log(`- Theme: ${schedule.theme || "未設定"}`)
      console.log(`- Date Range: ${JSON.stringify(schedule.dateRange)}`)
      console.log(`- Time: ${formatTimeRange(schedule.dateRange)}`)
      console.log(`- Is Personal Consultation: ${schedule.isPersonalConsultation}`)
      console.log(`- Is Reserved: ${schedule.isReserved}`)
    })
  }, [schedules])

  // 画面サイズを監視してデスクトップかどうかを判定
  useEffect(() => {
    const checkIfDesktop = () => {
      setIsDesktop(window.innerWidth >= 768) // 768px以上をデスクトップとみなす
    }

    checkIfDesktop()
    window.addEventListener("resize", checkIfDesktop)
    return () => window.removeEventListener("resize", checkIfDesktop)
  }, [])

  // 選択された日付のスケジュールを取得
  const getSchedulesForDate = (date: Date) => {
    return schedules.filter((schedule) => {
      if (!schedule.dateRange || !schedule.dateRange.start) return false
      try {
        const scheduleDate = parseISO(schedule.dateRange.start)
        return isSameDay(scheduleDate, date)
      } catch (error) {
        console.error("Error parsing date:", error)
        return false
      }
    })
  }

  // 日付に予定があるかどうかを確認
  const hasScheduleOnDate = (date: Date) => {
    return getSchedulesForDate(date).length > 0
  }

  // 日付がクリックされたときの処理
  const handleDateClick = (date: Date | undefined) => {
    if (date && hasScheduleOnDate(date)) {
      setSelectedDate(date)
      setIsDialogOpen(true)
    }
  }

  // 予約ボタンがクリックされたときの処理
  const handleReservationClick = (schedule: Schedule) => {
    setSelectedSchedule(schedule)
    setIsReservationDialogOpen(true)
  }

  // 予約を確定する処理
  const confirmReservation = async () => {
    if (!selectedSchedule) return

    setIsReserving(true)

    try {
      const response = await fetch("/api/consultation/reserve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          scheduleId: selectedSchedule.id,
        }),
      })

      if (!response.ok) {
        throw new Error(`サーバーエラー: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        toast({
          title: "予約完了",
          description: "個人コンサルテーションの予約が完了しました",
        })
        // ダイアログを閉じる
        setIsReservationDialogOpen(false)
        setIsDialogOpen(false)
        // 予約済みのコンサルを非表示にするために、ページをリロード
        window.location.reload()
      } else {
        throw new Error(data.error || "予約に失敗しました")
      }
    } catch (error) {
      console.error("Reservation error:", error)
      toast({
        title: "エラー",
        description: error instanceof Error ? error.message : "予約に失敗しました",
        variant: "destructive",
      })
    } finally {
      setIsReserving(false)
    }
  }

  if (schedules.length === 0) {
    return <div className="text-center py-4 text-gray-500">予定はありません</div>
  }

  return (
    <div>
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={handleDateClick}
        locale={ja}
        className={`rounded-md border ${isDesktop ? "h-[600px] max-w-full" : ""}`}
        modifiers={{
          hasSchedule: (date) => hasScheduleOnDate(date),
        }}
        modifiersStyles={{
          hasSchedule: { backgroundColor: "#e0f2fe", fontWeight: "bold" },
        }}
        components={{
          DayContent: (props) => {
            const schedulesForDate = getSchedulesForDate(props.date)
            const hasSchedule = schedulesForDate.length > 0

            return (
              <div className="relative w-full h-full flex flex-col items-center justify-center">
                <div>{props.date.getDate()}</div>
                {hasSchedule && isDesktop && (
                  <div className="absolute top-full left-0 w-full">
                    <div className="text-xs text-center mt-1 max-w-full px-1">
                      {schedulesForDate.map((s, index) => (
                        <div key={index} className="truncate mb-1 bg-blue-50 p-1 rounded">
                          {s.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {hasSchedule && !isDesktop && (
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

                  <div className="mt-2 space-y-1 text-xs text-gray-600">
                    {schedule.dateRange && (
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>時間: {formatTimeRange(schedule.dateRange)}</span>
                      </div>
                    )}

                    {schedule.instructor && (
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        <span>講師: {schedule.instructor}</span>
                      </div>
                    )}

                    {schedule.theme && (
                      <div className="flex items-center">
                        <Tag className="h-4 w-4 mr-2" />
                        <span>テーマ: {schedule.theme}</span>
                      </div>
                    )}
                  </div>

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

                    {schedule.isPersonalConsultation && (
                      <Button
                        onClick={() => handleReservationClick(schedule)}
                        className="w-full mt-2"
                        variant="outline"
                      >
                        予約する
                      </Button>
                    )}
                  </div>
                </div>
              ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              <X className="mr-2 h-4 w-4" />
              閉じる
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isReservationDialogOpen} onOpenChange={setIsReservationDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>個人コンサルテーションの予約</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedSchedule && (
                <>
                  <p className="mb-2">以下の個人コンサルテーションを予約しますか？</p>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p>
                      <strong>日時:</strong>{" "}
                      {selectedSchedule.dateRange?.start &&
                        format(parseISO(selectedSchedule.dateRange.start), "yyyy年MM月dd日", { locale: ja })}{" "}
                      {formatTimeRange(selectedSchedule.dateRange)}
                    </p>
                    <p>
                      <strong>講師:</strong> {selectedSchedule.instructor || "未設定"}
                    </p>
                  </div>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isReserving}>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReservation} disabled={isReserving}>
              {isReserving ? "予約中..." : "予約する"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
