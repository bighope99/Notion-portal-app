"use server"

import { sendEmail } from "./email"

// 予約関連のメールを送信する関数
export async function sendReservationEmails(
  userName: string,
  userEmail: string,
  scheduleName: string,
  formattedDate: string,
  instructor: string | null,
): Promise<void> {
  try {
    // オーナーへの通知メール送信
    await sendReservationNotificationEmail(userName, userEmail, scheduleName, formattedDate, instructor)
  } catch (error) {
    console.error("Failed to send reservation emails:", error)
  }
}

// オーナーへ通知メールを送信
async function sendReservationNotificationEmail(
  userName: string,
  userEmail: string,
  scheduleName: string,
  formattedDate: string,
  instructor: string | null,
): Promise<void> {
  const ownerEmail = "salonem.aroma@gmail.com"
  const subject = `【新規予約】個人コンサル(${userName}様)`

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">新規予約通知</h2>
      <p>個人コンサル新しい予約が入りました。</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>予約者名:</strong> ${userName}</p>
        <p><strong>メールアドレス:</strong> ${userEmail}</p>
        <p><strong>日時:</strong> ${formattedDate}</p>
        <p><strong>内容:</strong> ${scheduleName}</p>
        ${instructor ? `<p><strong>講師:</strong> ${instructor}</p>` : ""}
      </div>
            
      <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
      <p style="font-size: 12px; color: #666;">このメールは自動送信されています。</p>
    </div>
  `

  await sendEmail(ownerEmail, subject, html)
}
