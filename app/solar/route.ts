import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch("https://www.hamqsl.com/solarxml.php", {
      next: { revalidate: 3600 } 
    });
    
    if (!res.ok) throw new Error("N0NBH Server Down");
    
    const xml = await res.text();
    return new NextResponse(xml, { headers: { "Content-Type": "application/xml" } });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch solar data" }, { status: 500 });
  }
}
