"use client"

import { ExternalLink } from "lucide-react"
import { useState, useEffect } from "react"

interface PersonalLinksProps {
  personalLink1: string | null
  personalLink2: string | null
  personalLink3: string | null
  linkName1?: string | null
  linkName2?: string | null
  linkName3?: string | null
}

export default function PersonalLinks({
  personalLink1,
  personalLink2,
  personalLink3,
  linkName1,
  linkName2,
  linkName3,
}: PersonalLinksProps) {
  // クライアントサイドでのみレンダリングを行う
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // リンクが1つもない場合は何も表示しない
  if (!personalLink1 && !personalLink2 && !personalLink3) {
    return null
  }

  // サーバーサイドレンダリング時は何も表示しない
  if (!isClient) {
    return null
  }

  // リンクの有効性を確認する関数
  const isValidUrl = (url: string | null): boolean => {
    if (!url) return false
    try {
      new URL(url)
      return true
    } catch (e) {
      return false
    }
  }

  return (
    <div className="flex flex-wrap gap-4 mb-6">
      {personalLink1 && isValidUrl(personalLink1) && (
        <a
          href={personalLink1}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center text-blue-600 hover:text-blue-800 hover:underline bg-blue-50 px-3 py-2 rounded-md"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          <span>{linkName1 || "個人リンク 1"}</span>
        </a>
      )}

      {personalLink2 && isValidUrl(personalLink2) && (
        <a
          href={personalLink2}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center text-blue-600 hover:text-blue-800 hover:underline bg-blue-50 px-3 py-2 rounded-md"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          <span>{linkName2 || "個人リンク 2"}</span>
        </a>
      )}

      {personalLink3 && isValidUrl(personalLink3) && (
        <a
          href={personalLink3}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center text-blue-600 hover:text-blue-800 hover:underline bg-blue-50 px-3 py-2 rounded-md"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          <span>{linkName3 || "個人リンク 3"}</span>
        </a>
      )}
    </div>
  )
}
