import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const apiKey = process.env.QRZ_LOGBOOK_API_KEY; 
    
    if (!apiKey) {
      throw new Error("QRZ_API_KEY environment variable is missing.");
    }

    // 1. FETCH STATUS AGGREGATES
    const statusUrl = `https://logbook.qrz.com/api?KEY=${apiKey}&ACTION=STATUS`;
    const statusRes = await fetch(statusUrl, { cache: 'no-store' });
    const statusText = await statusRes.text();

    const statusData: any = {};
    statusText.split('&').forEach(pair => {
      const [key, value] = pair.split('=');
      if (key && value) {
        statusData[key.toLowerCase()] = value;
      }
    });

    // 2. FETCH ADIF RECORDS
    const fetchUrl = `https://logbook.qrz.com/api?KEY=${apiKey}&ACTION=FETCH`;
    const fetchRes = await fetch(fetchUrl, { cache: 'no-store' });
    const fetchText = await fetchRes.text();

    // 3. COMBINE AND SEND (With enhanced QRZ variable aliases)
    return NextResponse.json({ 
      data: fetchText, 
      count: statusData.count || null,           
      confirmed: statusData.cqsl || statusData.confirmed || null, 
      dxcc: statusData.dxcc_count || statusData.dxcc || null 
    });

  } catch (error: any) {
    console.error("QRZ Proxy Error:", error.message);
    return NextResponse.json({ error: "QRZ Proxy Offline", data: "" }, { status: 500 });
  }
}
