declare namespace NodeJS {
  interface ProcessEnv {
    NOTION_API_KEY: string
    MAGIC_SECRET_KEY: string
    NEXT_PUBLIC_APP_URL?: string
  }
}
