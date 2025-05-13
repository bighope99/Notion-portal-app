"use server"

// GASのWebアプリURLを環境変数から取得
const GAS_EMAIL_ENDPOINT = process.env.GAS_EMAIL_ENDPOINT || ""

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    // 開発環境またはGAS_EMAIL_ENDPOINTが設定されていない場合はモック処理
    if (!GAS_EMAIL_ENDPOINT || process.env.NODE_ENV !== "production") {
      console.log("========== EMAIL MOCK ==========")
      console.log(`To: ${to}`)
      console.log(`Subject: ${subject}`)
      console.log(`Content: ${html}`)
      console.log("================================")
      return { success: true, mock: true }
    }

    // 本番環境ではGASのWebアプリにリクエストを送信
    const response = await fetch(GAS_EMAIL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to,
        subject,
        html,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to send email: ${response.status}`)
    }

    const result = await response.json()
    return { success: true, result }
  } catch (error) {
    console.error("Email sending error:", error)
    // エラーが発生しても成功を返す（ログイン処理を継続するため）
    return { success: true, error: String(error) }
  }
}
