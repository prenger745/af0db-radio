import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const apiKey = process.env.QRZ_LOGBOOK_API_KEY
    if (!apiKey) {
      console.error("CRITICAL RUNTIME ERROR: QRZ_LOGBOOK_API_KEY missing from Vercel variables context.")
      return new NextResponse("RESULT=FAIL&REASON=MISSING_KEY", { status: 200 })
    }

    // Server-to-server requests ignore browser CORS restrictions completely
    const response = await fetch("https://logbook.qrz.com/api", {
      method: "POST",
      headers: { 
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "AF0DBConsole/3.0.0"
      },
      body: `KEY=${encodeURIComponent(apiKey)}&ACTION=FETCH&OPTION=TYPE%3AADIF`,
      cache: "no-store"
    })

    if (!response.ok) {
      return new NextResponse(`RESULT=FAIL&REASON=HTTP_ERROR_${response.status}`, { status: 200 })
    }

    const rawText = await response.text()
    
    // Return the raw text directly down to our page template
    return new NextResponse(rawText, {
      status: 200,
      headers: { "Content-Type": "text/plain" }
    })
  } catch (error) {
    console.error("Proxy route execution failure:", error)
    return new NextResponse("RESULT=FAIL&REASON=SERVER_EXCEPTION", { status: 500 })
  }
}
