import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const apiKey = process.env.QRZ_LOGBOOK_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Missing API Key" }, { status: 200 })
    }

    // Fetch the raw text stream from QRZ
    const response = await fetch("https://logbook.qrz.com/api", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `KEY=${encodeURIComponent(apiKey)}&ACTION=FETCH&OPTION=TYPE%3AADIF`,
      cache: "no-store"
    })

    if (!response.ok) {
      return NextResponse.json({ error: `HTTP_ERROR_${response.status}` }, { status: 200 })
    }

    const rawText = await response.text()
    
    // Package it safely inside a JSON object to protect it from browser decoding crashes
    return NextResponse.json({ data: rawText })
  } catch (error) {
    console.error("Proxy failure:", error)
    return NextResponse.json({ error: "SERVER_EXCEPTION" }, { status: 500 })
  }
}
