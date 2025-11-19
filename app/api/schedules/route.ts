import { NextRequest, NextResponse } from "next/server"
import { getSchedules } from "@/lib/notion"

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const year = searchParams.get("year")
        const month = searchParams.get("month")
        const type = searchParams.get("type")

        let date: Date | undefined
        if (year && month) {
            date = new Date(parseInt(year), parseInt(month) - 1)
        }

        const scheduleType =
            type === "regular" || type === "consultation" || type === "archive"
                ? (type as "regular" | "consultation" | "archive")
                : undefined

        const data = await getSchedules({
            date,
            type: scheduleType,
        })

        return NextResponse.json(data)
    } catch (error) {
        console.error("Failed to fetch schedules:", error)
        return NextResponse.json({ error: "Failed to fetch schedules" }, { status: 500 })
    }
}
