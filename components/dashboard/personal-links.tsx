"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ExternalLink } from "lucide-react"

interface PersonalLinksProps {
  personalLink1: string | null
  personalLink2: string | null
  personalLink3: string | null
}

export default function PersonalLinks({ personalLink1, personalLink2, personalLink3 }: PersonalLinksProps) {
  // リンクが1つもない場合は何も表示しない
  if (!personalLink1 && !personalLink2 && !personalLink3) {
    return null
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>個人リンク</CardTitle>
        <CardDescription>あなた専用のリソースリンク</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {personalLink1 && (
            <a
              href={personalLink1}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-blue-600 hover:text-blue-800 hover:underline"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              <span>個人リンク 1</span>
            </a>
          )}

          {personalLink2 && (
            <a
              href={personalLink2}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-blue-600 hover:text-blue-800 hover:underline"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              <span>個人リンク 2</span>
            </a>
          )}

          {personalLink3 && (
            <a
              href={personalLink3}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-blue-600 hover:text-blue-800 hover:underline"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              <span>個人リンク 3</span>
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
