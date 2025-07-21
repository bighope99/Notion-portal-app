'use client'

export default async function LogoutPage() {
  const response = await fetch("/api/auth/clear-cookies", {
    method: "GET",
    cache: "no-store",
  })
  console.log("response", response.ok)
  if (response.ok) {
    window.location.href = '/login'
  } else {
    throw new Error("ログアウトに失敗しました")
  }
}
