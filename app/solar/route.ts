import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch("https://www.hamqsl.com/solarxml.php", {
      headers: {
        // Disguises the Vercel edge server as a standard Windows web browser to bypass N0NBH bot firewalls
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/xml, text/xml, */*"
      },
      next: { revalidate: 3600 } 
    });
    
    if (!res.ok) throw new Error(`N0NBH Server Rejected Connection: ${res.status}`);
    
    const xml = await res.text();
    return new NextResponse(xml, { headers: { "Content-Type": "application/xml" } });
  } catch (error: any) {
    console.error("Solar Fetch Error:", error.message);
    return NextResponse.json({ error: "Failed to fetch solar data" }, { status: 500 });
  }
}
