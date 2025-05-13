"use client"
import { format, parseISO } from "date-fns"
import { ja } from "date-fns/locale"
import { ExternalLink, Calendar, User, Tag, Clock } from "lucide-react"
import type { Schedule, DateRange } from "@/lib/notion"

interface ArchiveListProps {
  archives: Schedule[]
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

export default function ArchiveList({ archives }: ArchiveListProps) {
  if (archives.length === 0) {
    return <div className="text-center py-8 text-gray-500">アーカイブはありません</div>
  }

  return (
    <div className="space-y-4">
      {archives.map((archive) => (
        <div key={archive.id} className="p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
          <h3 className="font-medium text-lg">{archive.name}</h3>

          <div className="mt-2 space-y-1 text-sm text-gray-600">
            {archive.dateRange && archive.dateRange.start && (
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                <span>{format(parseISO(archive.dateRange.start), "yyyy年MM月dd日", { locale: ja })}</span>
              </div>
            )}

            {archive.dateRange && (
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                <span>時間: {formatTimeRange(archive.dateRange)}</span>
              </div>
            )}

            {archive.instructor && (
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2" />
                <span>講師: {archive.instructor}</span>
              </div>
            )}

            {archive.theme && (
              <div className="flex items-center">
                <Tag className="h-4 w-4 mr-2" />
                <span>テーマ: {archive.theme}</span>
              </div>
            )}
          </div>

          {archive.url && (
            <div className="mt-3">
              <a
                href={archive.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                アーカイブを見る
              </a>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
