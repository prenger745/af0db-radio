import { NextResponse } from 'next/server';

// Forces Vercel to run this on the server every time instead of caching a static response
export const dynamic = 'force-dynamic'; 

export async function GET() {
  try {
    // Adding a timestamp query parameter completely obliterates any cached versions
    const targetUrl = `https://www.hamqsl.com/solarxml.php?_=${Date.now()}`;
    
    const res = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/xml, text/xml, */*"
      },
      cache: 'no-store' // Strictly forbids Next.js from memorizing this fetch
    });
    
    if (!res.ok) throw new Error(`N0NBH Server Rejected Connection: ${res.status}`);
    
    const xml = await res.text();
    return new NextResponse(xml, { headers: { "Content-Type": "application/xml" } });
  } catch (error: any) {
    console.error("Solar Fetch Error:", error.message);
    return NextResponse.json({ error: "Failed to fetch solar data", details: error.message }, { status: 500 });
  }
}
