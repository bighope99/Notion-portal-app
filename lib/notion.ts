"use server"

import { Client } from "@notionhq/client"

// Notion APIクライアントの初期化
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
})

// データベースID
const STUDENTS_DB_ID = "1c7092aab01480508483e8625bd946f2"
const TASKS_DB_ID = "1c6092aab0148006a92df5f762ed0bf4"
const SUBMISSIONS_DB_ID = "1d2092aab01480be9ec3e77f584d4418"
const SCHEDULES_DB_ID = "1c6092aab0148032be11c46e90baea16"

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
    const property = properties[propertyName]
    if (!property) return null

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
        return property.multi_select?.map((item: any) => item.name) || null
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
    return null
  }
}

// メールアドレスから学生情報を取得
export async function getStudentByEmail(email: string): Promise<Student | null> {
  try {
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

    const page = response.results[0]
    const properties = page.properties as any

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

// 学生IDに関連するタスクを取得
export async function getTasksByStudentId(studentId: string): Promise<Task[]> {
  try {
    // studentIdが空の場合は空の配列を返す
    if (!studentId) {
      return []
    }

    const response = await notion.databases.query({
      database_id: TASKS_DB_ID,
      filter: {
        property: "誰タスク",
        relation: {
          contains: studentId,
        },
      },
    })

    return response.results.map((page) => {
      const properties = page.properties as any

      return {
        id: page.id,
        name: getPropertyValue(properties, "名前", "title"),
        assignedTo: studentId, // リレーションの場合は学生IDを設定
        completed: getPropertyValue(properties, "完了", "checkbox"),
      }
    })
  } catch (error) {
    console.error("Failed to fetch tasks:", error)
    return []
  }
}

// タスクの完了状態を更新
export async function updateTaskStatus(taskId: string, completed: boolean): Promise<boolean> {
  try {
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

// 学生IDに関連する提出物を取得
export async function getSubmissionsByStudentId(studentId: string): Promise<Submission[]> {
  try {
    // studentIdが空の場合は空の配列を返す
    if (!studentId) {
      return []
    }

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

    return response.results.map((page) => {
      const properties = page.properties as any
      const createdTime = page.created_time

      return {
        id: page.id,
        name: getPropertyValue(properties, "名前", "title"),
        studentId, // 学生IDを設定
        url: getPropertyValue(properties, "URL", "url"),
        submittedAt: createdTime || "",
      }
    })
  } catch (error) {
    console.error("Failed to fetch submissions:", error)
    return []
  }
}

// 提出物を追加
export async function addSubmission(studentId: string, name: string, url: string): Promise<boolean> {
  try {
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

// 予定を取得（完了していないもののみ）
export async function getSchedules(): Promise<{
  regularSchedules: Schedule[]
  personalConsultations: Schedule[]
  archives: Schedule[]
}> {
  try {
    const response = await notion.databases.query({
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

    const schedules = response.results.map((page) => {
      const properties = page.properties as any
      const name = getPropertyValue(properties, "名前", "title")
      const theme = getPropertyValue(properties, "講義テーマ", "multi_select")

      // 講義テーマが"個人コンサル"かどうかで判定
      const isPersonalConsultation = theme.includes("個人コンサル")

      // 日付範囲（開始時間と終了時間）を取得
      const dateRange = getPropertyValue(properties, "実施日", "date_range")

      // 予約情報を取得
      const reservationName = getPropertyValue(properties, "予約名前", "rich_text")
      const reservationEmail = getPropertyValue(properties, "予約メアド", "rich_text")
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
    console.error("Failed to fetch schedules:", error)
    return {
      regularSchedules: [],
      personalConsultations: [],
      archives: [],
    }
  }
}

// ユーザーが予約済みの予定を取得
export async function getUserReservedSchedules(userEmail: string): Promise<Schedule[]> {
  try {
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
      const properties = page.properties as any
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

    return true
  } catch (error) {
    console.error("Failed to reserve consultation:", error)
    return false
  }
}
