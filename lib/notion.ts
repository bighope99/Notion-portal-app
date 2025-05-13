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
  personalPage: string
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
  personalPage: string
  url: string
  submittedAt?: string // 提出日時（存在する場合）
}

// 予定の型定義
export interface Schedule {
  id: string
  name: string
  url: string | null
  password: string | null
  instructor: string | null
  date: string
  theme: string | null
  isArchive: boolean
  completed: boolean
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
        return property.date?.start || null
      case "select":
        return property.select?.name || null
      case "url":
        return property.url || null
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
    console.log(`Fetching student with email: ${email}`)

    const response = await notion.databases.query({
      database_id: STUDENTS_DB_ID,
      filter: {
        property: "メールアドレス",
        email: {
          equals: email,
        },
      },
    })

    console.log(`Query response: ${JSON.stringify(response, null, 2)}`)

    if (response.results.length === 0) {
      console.log("No student found with this email")
      return null
    }

    const page = response.results[0]
    const properties = page.properties as any

    // デバッグ用にプロパティ名を出力
    console.log("Available properties:", Object.keys(properties))

    // 安全にプロパティを取得
    const student: Student = {
      id: page.id,
      name: getPropertyValue(properties, "名前", "title"),
      email: getPropertyValue(properties, "メールアドレス", "email"),
      personalPage: getPropertyValue(properties, "個人ページ", "rich_text"),
      progress: getPropertyValue(properties, "進捗", "rich_text"),
      lastViewedAt: getPropertyValue(properties, "最終閲覧時間", "date"),
      passwordHash: getPropertyValue(properties, "パスワード", "rich_text"),
      // isRetiredプロパティが存在する場合のみ使用
      ...(properties["退会"] ? { isRetired: getPropertyValue(properties, "退会", "checkbox") } : {}),
    }

    console.log("Parsed student:", student)
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

// 個人ページに関連するタスクを取得
export async function getTasksByPersonalPage(personalPage: string): Promise<Task[]> {
  try {
    const response = await notion.databases.query({
      database_id: TASKS_DB_ID,
      filter: {
        property: "誰タスク",
        rich_text: {
          equals: personalPage,
        },
      },
    })

    return response.results.map((page) => {
      const properties = page.properties as any

      return {
        id: page.id,
        name: getPropertyValue(properties, "名前", "title"),
        assignedTo: getPropertyValue(properties, "誰タスク", "rich_text"),
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

// 個人ページに関連する提出物を取得
export async function getSubmissionsByPersonalPage(personalPage: string): Promise<Submission[]> {
  try {
    const response = await notion.databases.query({
      database_id: SUBMISSIONS_DB_ID,
      filter: {
        property: "個人ページ",
        rich_text: {
          equals: personalPage,
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
        personalPage: getPropertyValue(properties, "個人ページ", "rich_text"),
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
export async function addSubmission(personalPage: string, name: string, url: string): Promise<boolean> {
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
          rich_text: [
            {
              text: {
                content: personalPage,
              },
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
export async function getSchedules(): Promise<Schedule[]> {
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

    return response.results.map((page) => {
      const properties = page.properties as any

      return {
        id: page.id,
        name: getPropertyValue(properties, "名前", "title"),
        url: getPropertyValue(properties, "URL", "url"),
        password: getPropertyValue(properties, "パスワード", "rich_text"),
        instructor: getPropertyValue(properties, "講師", "rich_text"),
        date: getPropertyValue(properties, "実施日", "date"),
        theme: getPropertyValue(properties, "講義テーマ", "select"),
        isArchive: getPropertyValue(properties, "アーカイブ", "checkbox"),
        completed: getPropertyValue(properties, "完了", "checkbox"),
      }
    })
  } catch (error) {
    console.error("Failed to fetch schedules:", error)
    return []
  }
}
