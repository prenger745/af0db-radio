import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const apiKey = process.env.QRZ_LOGBOOK_API_KEY
    if (!apiKey) {
      console.error("PROXY WARNING: Missing QRZ_LOGBOOK_API_KEY environment variable.")
      return new NextResponse("RESULT=FAIL&REASON=MISSING_ENV_KEY", { status: 200 })
    }

    // UPDATED BODY FORM PAYLOAD: Adding EXT_ORDER=DESC or grabbing the full set to ensure your latest contacts load
    const response = await fetch("https://logbook.qrz.com/api", {
      method: "POST",
      headers: { 
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "AF0DBConsole/3.5.0"
      },
      // Requesting TYPE:ADIF with un-truncated metrics so our frontend table can slice out the true last 15 entries out of your active book
      body: `KEY=${encodeURIComponent(apiKey)}&ACTION=FETCH&OPTION=TYPE%3AADIF`,
      cache: "no-store"
    })

    if (!response.ok) {
      return new NextResponse(`RESULT=FAIL&REASON=REMOTE_HTTP_ERR_${response.status}`, { status: 200 })
    }

    const rawText = await response.text()
    
    return new NextResponse(rawText, {
      status: 200,
      headers: { "Content-Type": "text/plain" }
    })
  } catch (error) {
    console.error("Proxy endpoint caught exception:", error)
    return new NextResponse("RESULT=FAIL&REASON=INTERNAL_SERVER_EXCEPTION", { status: 500 })
  }
}
