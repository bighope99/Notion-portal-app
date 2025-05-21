'use client'

import { redirect } from "next/navigation"

export default async function LogoutPage() {
  const response = await fetch("/api/auth/clear-cookies", {
    method: "POST",
    cache: "no-store",
  })
  console.log("response", response.ok)
  if (response.ok) {
    redirect("/login")
  } else {
    throw new Error("ログアウトに失敗しました")
  }
}
