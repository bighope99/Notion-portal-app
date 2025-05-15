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
    // 1. 予約者へのメール送信
    await sendReservationConfirmationEmail(userName, userEmail, scheduleName, formattedDate, instructor)

    // 2. オーナーへの通知メール送信
    await sendReservationNotificationEmail(userName, userEmail, scheduleName, formattedDate, instructor)
  } catch (error) {
    console.error("Failed to send reservation emails:", error)
  }
}

// 予約者へ確認メールを送信
async function sendReservationConfirmationEmail(
  userName: string,
  userEmail: string,
  scheduleName: string,
  formattedDate: string,
  instructor: string | null,
): Promise<void> {
  const subject = `【予約完了】個人コンサル(${formattedDate})`

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">個人コンサル約完了</h2>
      <p>${userName} 様</p>
      <p>個人コンサルご予約ありがとうございます。以下の内容で予約を承りました。</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>日時:</strong> ${formattedDate}</p>
        <p><strong>内容:</strong> ${scheduleName}</p>
        ${instructor ? `<p><strong>講師:</strong> ${instructor}</p>` : ""}
      </div>
      
      <div style="border-left: 4px solid #3b82f6; padding-left: 15px; margin: 20px 0;">
        <p><strong>【重要】面談前のアンケート提出のお願い</strong></p>
        <p>ご予約をされた際は、<span style="color: #e53e3e; font-weight: bold;">必ず面談予定日の前日までに</span>アンケートフォームの送信をお願いします。</p>
        <p>月最低1回は面談日を設けましょう！（最大3回まで）</p>
        <p><a href="https://forms.gle/XFRC8bDdZMrC5MNk9" style="color: #3b82f6; text-decoration: none; font-weight: bold;">アンケートフォームはこちら</a></p>
      </div>
      
      <p>ご不明な点がございましたら、このメールにご返信ください。</p>
      <p>よろしくお願いいたします。</p>
      
      <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
      <p style="font-size: 12px; color: #666;">このメールは自動送信されています。</p>
    </div>
  `

  await sendEmail(userEmail, subject, html)
}

// オーナーへ通知メールを送信
async function sendReservationNotificationEmail(
  userName: string,
  userEmail: string,
  scheduleName: string,
  formattedDate: string,
  instructor: string | null,
): Promise<void> {
  const ownerEmail = "taiki.work99@gmail.com"
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
      
      <p>予約者には自動的に確認メールが送信されています。</p>
      
      <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
      <p style="font-size: 12px; color: #666;">このメールは自動送信されています。</p>
    </div>
  `

  await sendEmail(ownerEmail, subject, html)
}
