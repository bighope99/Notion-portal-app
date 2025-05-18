"use server"

import { Client } from "@notionhq/client"
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints"
import { sendReservationEmails } from "./reservation-email"

// Notion APIクライアントの初期化（改善版）
let notionClient: Client | null = null

// Notionクライアントの初期化関数
function initNotionClient() {
  if (notionClient) return notionClient

  try {
    if (!process.env.NOTION_API_KEY) {
      throw new Error("NOTION_API_KEY is not set")
    }

    notionClient = new Client({
      auth: process.env.NOTION_API_KEY,
      // タイムアウト設定を追加（15秒）
      timeoutMs: 15000,
    })

    return notionClient
  } catch (error) {
    console.error("Failed to initialize Notion client:", error)
    return null
  }
}

// データベースID
const STUDENTS_DB_ID = "1ed2676ffda281c8a29dcca751cc0bc2"
const TASKS_DB_ID = "1ed2676ffda281c0aebdd93cc2d33c39"
const SUBMISSIONS_DB_ID = "1ed2676ffda2816a9588cb6b74f1f4cc"
const SCHEDULES_DB_ID = "1ed2676ffda28146919ecb4184d9405d"

// 学生情報の型定義
export interface Student {
  id: string
  name: string
  email: string
  personalPageId: string // 個人ページのリレーションID
  personalPage: string // 従来の個人ページ（テキスト）
  progress: string
  lastViewedAt: string | null
  passwordHash?: string | null
  isRetired?: boolean // 退会フラグ（存在しない場合は使用しない）
  personalLink1?: string | null // 個人リンク1
  personalLink2?: string | null // 個人リンク2
  personalLink3?: string | null // 個人リンク3
  linkName1?: string | null // 個人リンク1の名前
  linkName2?: string | null // 個人リンク2の名前
  linkName3?: string | null // 個人リンク3の名前
}

// タスクの型定義
export interface Task {
  id: string
  name: string
  assignedTo: string
  completed: boolean
}

// 提出物の型定義
export interface Submission {
  id: string
  name: string
  studentId: string // 学生のID
  url: string
  submittedAt?: string // 提出日時（存在する場合）
}

// 日付範囲の型定義
export interface DateRange {
  start: string
  end: string | null
}

// 予定の型定義
export interface Schedule {
  id: string
  name: string
  url: string | null
  password: string | null
  instructor: string | null
  dateRange: DateRange // 開始時間と終了時間を含む
  theme: string | null
  isArchive: boolean
  completed: boolean
  isPersonalConsultation: boolean // 個人コンサルかどうか
  reservationName: string | null // 予約者名
  reservationEmail: string | null // 予約者メールアドレス
  isReserved: boolean // 予約済みかどうか
  rawProperties?: any // デバッグ用：生のプロパティデータ
}

// Notionのプロパティから安全に値を取得するヘルパー関数
function getPropertyValue(properties: any, propertyName: string, type: string): any {
  try {
    if (!properties) {
      console.warn(`Properties object is undefined or null when getting ${propertyName}`)
      return null
    }

    const property = properties[propertyName]
    if (!property) {
      // プロパティが存在しない場合は警告を出すが、エラーにはしない
      console.warn(`Property ${propertyName} not found`)
      return type === "multi_select" ? [] : null
    }

    switch (type) {
      case "title":
        return property.title?.[0]?.plain_text || ""
      case "rich_text":
        return property.rich_text?.[0]?.plain_text || ""
      case "email":
        return property.email || ""
      case "checkbox":
        return property.checkbox || false
      case "date":
        // 日付の場合は開始時間のみを返す
        return property.date?.start || null
      case "date_range":
        // 日付範囲の場合は開始時間と終了時間の両方を返す
        return {
          start: property.date?.start || null,
          end: property.date?.end || null,
        }
      case "select":
        return property.select?.name || null
      case "multi_select":
        return property.multi_select?.map((item: any) => item.name) || []
      case "url":
        return property.url || null
      case "relation":
        // リレーションの場合は配列の最初の要素のIDを返す
        return property.relation?.[0]?.id || ""
      case "relation_array":
        // リレーションの場合は配列全体を返す
        return property.relation || []
      default:
        return null
    }
  } catch (error) {
    console.error(`Error getting property ${propertyName}:`, error)
    // エラーが発生した場合はデフォルト値を返す
    if (type === "multi_select") return []
    return null
  }
}

// メールアドレスから学生情報を取得
export async function getStudentByEmail(email: string): Promise<Student | null> {
  try {
    // Notionクライアントを初期化
    const notion = initNotionClient()
    if (!notion) {
      throw new Error("Notion client initialization failed")
    }

    const response = await notion.databases.query({
      database_id: STUDENTS_DB_ID,
      filter: {
        property: "メールアドレス",
        email: {
          equals: email,
        },
      },
    })

    if (response.results.length === 0) {
      return null
    }

    const page = response.results[0] as PageObjectResponse
    const properties = page.properties

    // デバッグ用にプロパティ名を出力
    // console.log("Available properties:", Object.keys(properties))

    // 個人ページのリレーションIDを取得
    const personalPageRelation = getPropertyValue(properties, "個人ページ", "relation")
    // console.log(`Personal page relation ID: ${personalPageRelation}`)

    // 安全にプロパティを取得
    const student: Student = {
      id: page.id,
      name: getPropertyValue(properties, "名前", "title"),
      email: getPropertyValue(properties, "メールアドレス", "email"),
      personalPageId: personalPageRelation, // リレーションの最初のIDを保存
      personalPage: getPropertyValue(properties, "個人ページ", "rich_text"), // 従来の個人ページ（テキスト）も保持
      progress: getPropertyValue(properties, "進捗", "rich_text"),
      lastViewedAt: getPropertyValue(properties, "最終閲覧時間", "date"),
      passwordHash: getPropertyValue(properties, "パスワード", "rich_text"),
      // isRetiredプロパティが存在する場合のみ使用
      ...(properties["退会"] ? { isRetired: getPropertyValue(properties, "退会", "checkbox") } : {}),
      personalLink1: getPropertyValue(properties, "個人リンク1", "url"),
      personalLink2: getPropertyValue(properties, "個人リンク2", "url"),
      personalLink3: getPropertyValue(properties, "個人リンク3", "url"),
      linkName1: getPropertyValue(properties, "リンク名1", "rich_text"),
      linkName2: getPropertyValue(properties, "リンク名2", "rich_text"),
      linkName3: getPropertyValue(properties, "リンク名3", "rich_text"),
    }

    return student
  } catch (error) {
    console.error("Failed to fetch student:", error)
    return null
  }
}

// 学生の最終閲覧時間を更新
export async function updateLastViewedAt(studentId: string): Promise<boolean> {
  try {
    // Notionクライアントを初期化
    const notion = initNotionClient()
    if (!notion) {
      throw new Error("Notion client initialization failed")
    }

    await notion.pages.update({
      page_id: studentId,
      properties: {
        最終閲覧時間: {
          date: {
            start: new Date().toISOString(),
          },
        },
      },
    })
    return true
  } catch (error) {
    console.error("Failed to update last viewed at:", error)
    return false
  }
}

// パスワードハッシュを保存
export async function savePasswordHash(studentId: string, passwordHash: string): Promise<boolean> {
  try {
    // Notionクライアントを初期化
    const notion = initNotionClient()
    if (!notion) {
      throw new Error("Notion client initialization failed")
    }

    await notion.pages.update({
      page_id: studentId,
      properties: {
        パスワード: {
          rich_text: [
            {
              text: {
                content: passwordHash,
              },
            },
          ],
        },
      },
    })
    return true
  } catch (error) {
    console.error("Failed to save password hash:", error)
    return false
  }
}

// メールアドレスからパスワードハッシュを取得
export async function getPasswordHashByEmail(email: string): Promise<string | null> {
  try {
    const student = await getStudentByEmail(email)
    if (!student) return null
    return student.passwordHash || null
  } catch (error) {
    console.error("Failed to get password hash:", error)
    return null
  }
}

// 学生IDに関連するタスクを取得 - エラーハンドリング強化版
export async function getTasksByStudentId(studentId: string): Promise<Task[]> {
  // リトライ回数を設定
  const maxRetries = 2
  let retryCount = 0

  // studentIdが空の場合は空の配列を返す
  if (!studentId) {
    console.log("Empty studentId provided to getTasksByStudentId, returning empty array")
    return []
  }

  while (retryCount <= maxRetries) {
    try {
      // Notionクライアントを初期化
      const notion = initNotionClient()
      if (!notion) {
        throw new Error("Notion client initialization failed")
      }

      // APIキーが設定されているか確認
      if (!process.env.NOTION_API_KEY) {
        throw new Error("NOTION_API_KEY is not set")
      }

      // データベースIDが有効か確認
      if (!TASKS_DB_ID) {
        throw new Error("TASKS_DB_ID is not valid")
      }

      console.log(`Fetching tasks for studentId: ${studentId}, attempt ${retryCount + 1}`)

      // API呼び出しを試行
      const response = await notion.databases.query({
        database_id: TASKS_DB_ID,
        filter: {
          property: "誰タスク",
          relation: {
            contains: studentId,
          },
        },
      })

      console.log(`Successfully fetched ${response.results.length} tasks`)

      return response.results.map((page) => {
        const properties = (page as PageObjectResponse).properties
        return {
          id: page.id,
          name: getPropertyValue(properties, "名前", "title"),
          assignedTo: studentId,
          completed: getPropertyValue(properties, "完了", "checkbox"),
        }
      })
    } catch (error: any) {
      // API呼び出しエラーをより詳細に記録
      console.error(`Notion API error in getTasksByStudentId (attempt ${retryCount + 1}):`, error)

      if (error.status) {
        console.error(`Status: ${error.status}, Code: ${error.code}`)
      }

      // 最後のリトライでも失敗した場合はエラーをスロー
      if (retryCount === maxRetries) {
        console.error("All retry attempts failed")
        // 空の配列を返す代わりにエラーをスロー
        throw new Error(`Failed to fetch tasks: ${error.message || "Unknown error"}`)
      }

      // リトライ可能なエラーの場合は待機してリトライ
      const waitTime = Math.pow(2, retryCount) * 1000 // 指数バックオフ
      console.log(`Retrying in ${waitTime}ms...`)
      await new Promise((resolve) => setTimeout(resolve, waitTime))
      retryCount++
    }
  }

  // ここには到達しないはずだが、TypeScriptの型チェックを満たすために空の配列を返す
  return []
}

// タスクの完了状態を更新
export async function updateTaskStatus(taskId: string, completed: boolean): Promise<boolean> {
  try {
    // Notionクライアントを初期化
    const notion = initNotionClient()
    if (!notion) {
      throw new Error("Notion client initialization failed")
    }

    await notion.pages.update({
      page_id: taskId,
      properties: {
        完了: {
          checkbox: completed,
        },
      },
    })

    return true
  } catch (error) {
    console.error("Failed to update task:", error)
    return false
  }
}

// 学生IDに関連する提出物を取得 - エラーハンドリング強化版
export async function getSubmissionsByStudentId(studentId: string): Promise<Submission[]> {
  // リトライ回数を設定
  const maxRetries = 2
  let retryCount = 0

  // studentIdが空の場合は空の配列を返す
  if (!studentId) {
    console.log("Empty studentId provided to getSubmissionsByStudentId, returning empty array")
    return []
  }

  while (retryCount <= maxRetries) {
    try {
      // Notionクライアントを初期化
      const notion = initNotionClient()
      if (!notion) {
        throw new Error("Notion client initialization failed")
      }

      // APIキーが設定されているか確認
      if (!process.env.NOTION_API_KEY) {
        throw new Error("NOTION_API_KEY is not set")
      }

      // データベースIDが有効か確認
      if (!SUBMISSIONS_DB_ID) {
        throw new Error("SUBMISSIONS_DB_ID is not valid")
      }

      console.log(`Fetching submissions for studentId: ${studentId}, attempt ${retryCount + 1}`)

      // API呼び出しを試行
      const response = await notion.databases.query({
        database_id: SUBMISSIONS_DB_ID,
        filter: {
          property: "個人ページ",
          relation: {
            contains: studentId,
          },
        },
        sorts: [
          {
            timestamp: "created_time",
            direction: "descending",
          },
        ],
      })

      console.log(`Successfully fetched ${response.results.length} submissions`)

      return response.results.map((page) => {
        const properties = (page as PageObjectResponse).properties
        const createdTime = (page as PageObjectResponse).created_time
        return {
          id: page.id,
          name: getPropertyValue(properties, "名前", "title"),
          studentId,
          url: getPropertyValue(properties, "URL", "url"),
          submittedAt: createdTime || "",
        }
      })
    } catch (error: any) {
      // API呼び出しエラーをより詳細に記録
      console.error(`Notion API error in getSubmissionsByStudentId (attempt ${retryCount + 1}):`, error)

      if (error.status) {
        console.error(`Status: ${error.status}, Code: ${error.code}`)
      }

      // 最後のリトライでも失敗した場合はエラーをスロー
      if (retryCount === maxRetries) {
        console.error("All retry attempts failed")
        // 空の配列を返す代わりにエラーをスロー
        throw new Error(`Failed to fetch submissions: ${error.message || "Unknown error"}`)
      }

      // リトライ可能なエラーの場合は待機してリトライ
      const waitTime = Math.pow(2, retryCount) * 1000 // 指数バックオフ
      console.log(`Retrying in ${waitTime}ms...`)
      await new Promise((resolve) => setTimeout(resolve, waitTime))
      retryCount++
    }
  }

  // ここには到達しないはずだが、TypeScriptの型チェックを満たすために空の配列を返す
  return []
}

// 提出物を追加
export async function addSubmission(studentId: string, name: string, url: string): Promise<boolean> {
  try {
    // Notionクライアントを初期化
    const notion = initNotionClient()
    if (!notion) {
      throw new Error("Notion client initialization failed")
    }

    await notion.pages.create({
      parent: {
        database_id: SUBMISSIONS_DB_ID,
      },
      properties: {
        名前: {
          title: [
            {
              text: {
                content: name,
              },
            },
          ],
        },
        URL: {
          url: url,
        },
        個人ページ: {
          relation: [
            {
              id: studentId,
            },
          ],
        },
      },
    })

    return true
  } catch (error) {
    console.error("Failed to add submission:", error)
    return false
  }
}

// 予定を取得（完了していないもののみ）- エラーハンドリング強化版
export async function getSchedules(): Promise<{
  regularSchedules: Schedule[]
  personalConsultations: Schedule[]
  archives: Schedule[]
}> {
  // 開始時間を記録（パフォーマンス測定用）
  const startTime = Date.now()

  try {
    // Notionクライアントを初期化
    const notionClient = initNotionClient()

    if (!notionClient) {
      throw new Error("Notion client initialization failed")
    }

    // APIキーが設定されているか確認
    if (!process.env.NOTION_API_KEY) {
      throw new Error("NOTION_API_KEY is not set")
    }

    // データベースIDが有効か確認
    if (!SCHEDULES_DB_ID) {
      throw new Error("SCHEDULES_DB_ID is not valid")
    }

    // API呼び出しを試行
    let response
    try {
      response = await notionClient.databases.query({
        database_id: SCHEDULES_DB_ID,
        filter: {
          property: "完了",
          checkbox: {
            equals: false,
          },
        },
        sorts: [
          {
            property: "実施日",
            direction: "ascending",
          },
        ],
      })
    } catch (apiError: any) {
      // API呼び出しエラーをより詳細に記録
      console.error(`Notion API error: ${apiError.message}`)
      console.error(`Status: ${apiError.status}`)
      console.error(`Code: ${apiError.code}`)

      // リトライ可能なエラーの場合は一度だけ再試行
      if (apiError.status === 429 || apiError.status === 500 || apiError.status === 503) {
        console.log("Retrying Notion API request after 1 second...")
        await new Promise((resolve) => setTimeout(resolve, 1000))

        response = await notionClient.databases.query({
          database_id: SCHEDULES_DB_ID,
          filter: {
            property: "完了",
            checkbox: {
              equals: false,
            },
          },
          sorts: [
            {
              property: "実施日",
              direction: "ascending",
            },
          ],
        })
      } else {
        throw apiError
      }
    }

    // パフォーマンスログ
    const duration = Date.now() - startTime
    console.log(`Notion API query completed in ${duration}ms`)

    const schedules = response.results.map((page) => {
      const properties = (page as PageObjectResponse).properties
      const name = getPropertyValue(properties, "名前", "title")
      const theme = getPropertyValue(properties, "講義テーマ", "multi_select")

      // 講義テーマが"個人コンサル"かどうかで判定
      const isPersonalConsultation = Array.isArray(theme) && theme.includes("個人コンサル")

      // 日付範囲（開始時間と終了時間）を取得
      const dateRange = getPropertyValue(properties, "実施日", "date_range")

      // 予約情報を取得
      const reservationName = getPropertyValue(properties, "予約名前", "rich_text")
      const reservationEmail = getPropertyValue(properties, "予約メアド", "email")
      const isReserved = !!(reservationName && reservationEmail)

      return {
        id: page.id,
        name,
        url: getPropertyValue(properties, "URL", "url"),
        password: getPropertyValue(properties, "パスワード", "rich_text"),
        instructor: getPropertyValue(properties, "講師", "rich_text"),
        dateRange, // 開始時間と終了時間を含む
        theme,
        isArchive: getPropertyValue(properties, "アーカイブ", "checkbox"),
        completed: getPropertyValue(properties, "完了", "checkbox"),
        isPersonalConsultation,
        reservationName,
        reservationEmail,
        isReserved,
      }
    })

    // 予定を分類
    const regularSchedules = schedules.filter((schedule) => !schedule.isArchive && !schedule.isPersonalConsultation)

    // 個人コンサルテーションは予約済みのものを除外
    const personalConsultations = schedules.filter(
      (schedule) => !schedule.isArchive && schedule.isPersonalConsultation && !schedule.isReserved,
    )

    const archives = schedules.filter((schedule) => schedule.isArchive)

    return {
      regularSchedules,
      personalConsultations,
      archives,
    }
  } catch (error) {
    // より詳細なエラー情報をログに出力
    console.error("Failed to fetch schedules:", error)
    if (error instanceof Error) {
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
    }

    // エラーを再スローして呼び出し元で処理できるようにする
    throw new Error(`Failed to fetch schedules: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

// ユーザーが予約済みの予定を取得
export async function getUserReservedSchedules(userEmail: string): Promise<Schedule[]> {
  try {
    // Notionクライアントを初期化
    const notion = initNotionClient()
    if (!notion) {
      throw new Error("Notion client initialization failed")
    }

    const response = await notion.databases.query({
      database_id: SCHEDULES_DB_ID,
      filter: {
        and: [
          {
            property: "予約メアド",
            email: {
              equals: userEmail,
            },
          },
          {
            property: "完了",
            checkbox: {
              equals: false,
            },
          },
        ],
      },
      sorts: [
        {
          property: "実施日",
          direction: "ascending",
        },
      ],
    })

    return response.results.map((page) => {
      const properties = (page as PageObjectResponse).properties
      const name = getPropertyValue(properties, "名前", "title")
      const theme = getPropertyValue(properties, "講義テーマ", "multi_select")
      const isPersonalConsultation = theme.includes("個人コンサル")
      const dateRange = getPropertyValue(properties, "実施日", "date_range")
      const reservationName = getPropertyValue(properties, "予約名前", "rich_text")
      const reservationEmail = getPropertyValue(properties, "予約メアド", "email")
      const isReserved = !!(reservationName && reservationEmail)

      return {
        id: page.id,
        name,
        url: getPropertyValue(properties, "URL", "url"),
        password: getPropertyValue(properties, "パスワード", "rich_text"),
        instructor: getPropertyValue(properties, "講師", "rich_text"),
        dateRange,
        theme,
        isArchive: getPropertyValue(properties, "アーカイブ", "checkbox"),
        completed: getPropertyValue(properties, "完了", "checkbox"),
        isPersonalConsultation,
        reservationName,
        reservationEmail,
        isReserved,
      }
    })
  } catch (error) {
    console.error("Failed to fetch user reserved schedules:", error)
    return []
  }
}
// 個人コンサルテーションを予約
export async function reserveConsultation(scheduleId: string, name: string, email: string): Promise<boolean> {
  try {
    // Notionクライアントを初期化
    const notion = initNotionClient()
    if (!notion) {
      throw new Error("Notion client initialization failed")
    }

    // Notionデータベースの更新
    await notion.pages.update({
      page_id: scheduleId,
      properties: {
        予約名前: {
          rich_text: [
            {
              text: {
                content: name,
              },
            },
          ],
        },
        予約メアド: {
          email: email,
        },
      },
    })

    // 予約した予定の詳細を取得
    const response = await notion.pages.retrieve({
      page_id: scheduleId,
    })

    const properties = (response as PageObjectResponse).properties
    const scheduleName = getPropertyValue(properties, "名前", "title")
    const dateRange = getPropertyValue(properties, "実施日", "date_range")
    const instructor = getPropertyValue(properties, "講師", "rich_text")

    // 日付をフォーマット
    let formattedDate = ""
    if (dateRange && dateRange.start) {
      try {
        const startDate = new Date(dateRange.start)
        formattedDate = `${startDate.getFullYear()}年${startDate.getMonth() + 1}月${startDate.getDate()}日 ${startDate.getHours()}:${String(startDate.getMinutes()).padStart(2, "0")}`

        if (dateRange.end) {
          const endDate = new Date(dateRange.end)
          formattedDate += ` - ${endDate.getHours()}:${String(endDate.getMinutes()).padStart(2, "0")}`
        }
      } catch (error) {
        console.error("Date formatting error:", error)
      }
    }

    // メール送信処理を呼び出す
    await sendReservationEmails(name, email, scheduleName, formattedDate, instructor)

    return true
  } catch (error) {
    console.error("Failed to reserve consultation:", error)
    return false
  }
}
