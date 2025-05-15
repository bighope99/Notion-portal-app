"use client"

import { useState, useMemo } from "react"
import type { Schedule, DateRange } from "@/lib/notion"
import { ja } from "date-fns/locale"
import {
  format,
  isSameDay,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  addMonths,
  subMonths,
  getDay,
  startOfWeek,
  endOfWeek,
  isToday,
} from "date-fns"
import { Button } from "@/components/ui/button"
import { CalendarIcon, X, ExternalLink, User, Tag, Clock, ChevronLeft, ChevronRight } from "lucide-react"
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

// 日付から時間部分のみを抽出する関数
function formatTime(dateString: string): string {
  if (!dateString) return ""

  try {
    const date = parseISO(dateString)
    return format(date, "HH:mm")
  } catch (error) {
    console.error("Error formatting time:", error)
    return ""
  }
}

export default function ScheduleCalendar({ schedules }: ScheduleCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null)
  const [isReservationDialogOpen, setIsReservationDialogOpen] = useState(false)
  const [isReserving, setIsReserving] = useState(false)
  const { toast } = useToast()

  // 曜日の配列（日曜日から始まる）
  const weekDays = ["日", "月", "火", "水", "木", "金", "土"]

  // 現在の月のカレンダーグリッドを計算
  const calendarDays = useMemo(() => {
    // 月の最初と最後の日を取得
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)

    // 週の最初（日曜日）と最後（土曜日）を取得して、カレンダーグリッドを作成
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)

    // 日付の範囲を配列として取得
    return eachDayOfInterval({ start: startDate, end: endDate })
  }, [currentMonth])

  // 前月へ移動
  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  // 翌月へ移動
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  // 今月へ移動
  const goToToday = () => {
    setCurrentMonth(new Date())
  }

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
  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    if (hasScheduleOnDate(date)) {
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

    // すでに予約済みかチェック
    if (selectedSchedule.reservationName) {
      toast({
        title: "予約エラー",
        description: "この予定はすでに予約されています",
        variant: "destructive",
      })
      setIsReservationDialogOpen(false)
      return
    }

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
          description: "個人コンサルの予約が完了しました",
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
    <div className="calendar-container">
      {/* カレンダーヘッダー */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">{format(currentMonth, "yyyy年M月", { locale: ja })}</h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            今日
          </Button>
          <Button variant="outline" size="sm" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* カレンダーグリッド */}
      <div className="grid grid-cols-7 border rounded-lg overflow-hidden bg-white">
        {/* 曜日ヘッダー */}
        {weekDays.map((day, index) => (
          <div
            key={index}
            className={`p-2 text-center font-medium border-b ${
              index === 0 ? "text-red-500" : index === 6 ? "text-blue-500" : ""
            }`}
          >
            {day}
          </div>
        ))}

        {/* 日付グリッド */}
        {calendarDays.map((day, index) => {
          const daySchedules = getSchedulesForDate(day)
          const isCurrentMonth = isSameMonth(day, currentMonth)
          const isSelectedDay = selectedDate && isSameDay(day, selectedDate)
          const isTodayDate = isToday(day)

          return (
            <div
              key={index}
              className={`min-h-[100px] border p-1 relative ${
                !isCurrentMonth ? "bg-gray-50 text-gray-400" : ""
              } ${isSelectedDay ? "bg-blue-50" : ""} ${isTodayDate ? "border-blue-500 border-2" : ""}`}
              onClick={() => handleDateClick(day)}
            >
              {/* 日付表示 */}
              <div
                className={`text-right text-sm mb-1 ${
                  getDay(day) === 0 ? "text-red-500" : getDay(day) === 6 ? "text-blue-500" : ""
                } ${!isCurrentMonth ? "text-gray-400" : ""}`}
              >
                {format(day, "d")}
              </div>

              {/* イベント表示 */}
              <div className="overflow-y-auto max-h-[80px]">
                {daySchedules.map((schedule, idx) => (
                  <div
                    key={idx}
                    className={`text-xs mb-1 p-1 rounded truncate ${
                      schedule.isPersonalConsultation ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
                    }`}
                    title={schedule.name}
                  >
                    {schedule.dateRange?.start && formatTime(schedule.dateRange.start)} {schedule.name}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

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
                    {/* 個人コンサルで予約前の場合はURLとパスワードを表示しない */}
                    {(!schedule.isPersonalConsultation || schedule.reservationName) && (
                      <>
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
                      </>
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
            <AlertDialogTitle>個人コンサルの予約</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedSchedule && selectedSchedule.reservationName ? (
                <div className="text-red-500">この予定はすでに予約されています。別の日時を選択してください。</div>
              ) : (
                <>
                  <div className="mb-2">以下の個人コンサルを予約しますか？</div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <div>
                      <strong>日時:</strong>{" "}
                      {selectedSchedule?.dateRange?.start &&
                        format(parseISO(selectedSchedule.dateRange.start), "yyyy年MM月dd日", { locale: ja })}{" "}
                      {selectedSchedule && formatTimeRange(selectedSchedule.dateRange)}
                    </div>
                    <div>
                      <strong>講師:</strong> {selectedSchedule?.instructor || "未設定"}
                    </div>
                  </div>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isReserving}>キャンセル</AlertDialogCancel>
            {selectedSchedule && !selectedSchedule.reservationName && (
              <AlertDialogAction onClick={confirmReservation} disabled={isReserving}>
                {isReserving ? "予約中..." : "予約する"}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
