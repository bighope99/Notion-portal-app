"use server"
import { magic } from "@/lib/magic"

export async function sendEmail(to: string, subject: string, html: string) {
  // このモック実装では、実際にメールは送信されず、コンソールに出力されるだけです
  console.log(`Sending email to: ${to}`)
  console.log(`Subject: ${subject}`)
  console.log(`Content: ${html}`)

  // 実際のアプリケーションでは、ここにメール送信ロジックを実装します
  // 例: SendGrid, Amazon SES, Mailchimp, Resendなどのサービスを使用
  await magic?.auth.loginWithMagicLink({ to })

  return { success: true }
}
