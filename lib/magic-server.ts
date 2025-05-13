import { Magic } from "@magic-sdk/admin"

// Magic Admin SDKのインスタンスをシングルトンとして作成
let magicAdmin: Magic | null = null

export const getMagicAdmin = () => {
  // サーバーサイドでのみ実行
  if (typeof window !== "undefined") return null

  if (!magicAdmin) {
    // 環境変数が設定されているか確認
    if (!process.env.MAGIC_SECRET_KEY) {
      console.error("MAGIC_SECRET_KEY is not set")
      return null
    }

    try {
      magicAdmin = new Magic(process.env.MAGIC_SECRET_KEY)
    } catch (error) {
      console.error("Failed to initialize Magic Admin SDK:", error)
      return null
    }
  }
  return magicAdmin
}
