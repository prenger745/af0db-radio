import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Check both public and private server environment slots
    const apiKey = process.env.NEXT_PUBLIC_QRZ_API_KEY || process.env.QRZ_API_KEY
    
    if (!apiKey) {
      console.error("CRITICAL DIAGNOSTIC: QRZ API Key missing from Vercel environment variables.")
      return new NextResponse("API_KEY_MISSING", { status: 200 })
    }

    const response = await fetch("https://logbook.qrz.com/api", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        KEY: apiKey,
        ACTION: "FETCH",
        OPTION: "TYPE:ADIF,MAX:50"
      }),
      next: { revalidate: 30 } // Cache for 30 seconds to stay within API limits
    })

    if (!response.ok) {
      console.error(`CRITICAL DIAGNOSTIC: QRZ Server rejected request with status code: ${response.status}`)
      return new NextResponse("QRZ_SERVER_ERROR", { status: 200 })
    }

    const rawAdifText = await response.text()
    
    // Log a tiny sample snippet to Vercel runtime logs for debugging
    console.log("QRZ API Payload Snippet:", rawAdifText.substring(0, 100))
    
    return new NextResponse(rawAdifText, {
      status: 200,
      headers: { "Content-Type": "text/plain" }
    })
  } catch (error) {
    console.error("CRITICAL DIAGNOSTIC: Server exception caught:", error)
    return new NextResponse("INTERNAL_ROUTING_EXCEPTION", { status: 500 })
  }
}
