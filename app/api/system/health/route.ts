import { NextResponse } from "next/server"
import { Client } from "@notionhq/client"

export async function GET() {
  const healthStatus = {
    status: "ok",
    time: new Date().toISOString(),
    notion: {
      apiKeyExists: !!process.env.NOTION_API_KEY,
      connectionStatus: "unknown",
    },
    environment: process.env.NODE_ENV || "unknown",
  }

  // Notion API接続テスト
  if (process.env.NOTION_API_KEY) {
    try {
      const notion = new Client({
        auth: process.env.NOTION_API_KEY,
        timeoutMs: 5000,
      })

      // 簡単なAPI呼び出しでテスト
      await notion.users.me()

      healthStatus.notion.connectionStatus = "connected"
    } catch (error) {
      console.error("Notion API health check failed:", error)
      healthStatus.notion.connectionStatus = "failed"
      healthStatus.status = "warning"

      if (error instanceof Error) {
        healthStatus.notion.error = error.message
      }
    }
  } else {
    healthStatus.notion.connectionStatus = "not_configured"
    healthStatus.status = "error"
  }

  return NextResponse.json(healthStatus)
}
