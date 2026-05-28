import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Queries the live global POTA spot firehose with a timestamp cache-buster
    const res = await fetch(`https://api.pota.app/spot/live?_=${Date.now()}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json"
      },
      cache: 'no-store'
    });

    if (!res.ok) throw new Error(`POTA API returned status: ${res.status}`);

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("POTA Telemetry Sync Failure:", error.message);
    return NextResponse.json({ error: "Link Down", spots: [] }, { status: 500 });
  }
}
