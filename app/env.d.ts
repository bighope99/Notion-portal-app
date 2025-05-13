declare namespace NodeJS {
  interface ProcessEnv {
    NOTION_API_KEY: string
    SECRET_KEY: string
    NEXT_PUBLIC_APP_URL?: string
    GAS_EMAIL_ENDPOINT?: string
  }
}
