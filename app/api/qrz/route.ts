import { NextResponse } from "next/server"

export async function GET() {
  try {
    const apiKey = process.env.NEXT_PUBLIC_QRZ_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "API Key Missing from Vercel Panel" }, { status: 500 })
    }

    // Server-to-server calls ignore CORS completely
    const response = await fetch("https://logbook.qrz.com/api", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        KEY: apiKey,
        ACTION: "FETCH",
        OPTION: "TYPE:ADIF,MAX:50"
      }),
      next: { revalidate: 60 } // Cache data for 60 seconds to avoid spamming the API
    })

    if (!response.ok) {
      return NextResponse.json({ error: "QRZ Server rejected authorization" }, { status: response.status })
    }

    const rawAdifText = await response.text()
    return new NextResponse(rawAdifText, {
      status: 200,
      headers: { "Content-Type": "text/plain" }
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Routing Exception" }, { status: 500 })
  }
}
