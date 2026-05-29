import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const apiKey = process.env.QRZ_API_KEY; 
    
    if (!apiKey) {
      throw new Error("QRZ_API_KEY environment variable is missing.");
    }

    // 1. FETCH STATUS AGGREGATES: Gets your exact Confirmed, DXCC, and Total counts
    const statusUrl = `https://logbook.qrz.com/api?KEY=${apiKey}&ACTION=STATUS`;
    const statusRes = await fetch(statusUrl, { cache: 'no-store' });
    const statusText = await statusRes.text();

    // Parse the &-separated name=value pairs from the STATUS response
    const statusData: any = {};
    statusText.split('&').forEach(pair => {
      const [key, value] = pair.split('=');
      if (key && value) {
        statusData[key.toLowerCase()] = value;
      }
    });

    // 2. FETCH ADIF RECORDS: Gets your actual logbook entries for the map and ledger
    const fetchUrl = `https://logbook.qrz.com/api?KEY=${apiKey}&ACTION=FETCH`;
    const fetchRes = await fetch(fetchUrl, { cache: 'no-store' });
    const fetchText = await fetchRes.text();

    // 3. COMBINE AND SEND
    return NextResponse.json({ 
      data: fetchText, // The raw ADIF string your frontend parses for the 15 table rows
      count: statusData.count || null,           // Total QSOs
      confirmed: statusData.cqsl || null,        // Total Confirmed
      dxcc: statusData.dxcc || null              // Total DXCC
    });

  } catch (error: any) {
    console.error("QRZ Proxy Error:", error.message);
    return NextResponse.json({ error: "QRZ Proxy Offline", data: "" }, { status: 500 });
  }
}
