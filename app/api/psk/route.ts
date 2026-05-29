import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const pskUrl = "https://retrieve.pskreporter.info/query?senderCallsign=AF0DB&flowStartSeconds=-7200&statistics=0";
    
    const res = await fetch(pskUrl, {
      headers: {
        "User-Agent": "AF0DB-Station-Dashboard/2.0",
        "Accept": "application/xml"
      },
      cache: "no-store"
    });

    if (!res.ok) throw new Error(`PSK Reporter API returned status: ${res.status}`);
    
    const xmlText = await res.text();

    const spots: any[] = [];
    
    // COMPILER FIX: Using standard RegExp execution loop instead of matchAll iterator
    const regex = /<receptionReport\s+([^>]+)>/g;
    let match;
    
    while ((match = regex.exec(xmlText)) !== null) {
      if (spots.length >= 15) break;
      const attrString = match[1];
      
      const receiverCallM = attrString.match(/receiverCallsign="([^"]+)"/);
      const gridM = attrString.match(/receiverLocator="([^"]+)"/);
      const snrM = attrString.match(/sNR="([^"]+)"/);
      const timeM = attrString.match(/reportReceiverTimestamp="([^"]+)"/);

      if (receiverCallM && gridM) {
        const grid = gridM[1].toUpperCase();
        
        let lat = 39.8283;
        let lng = -98.5795;
        if (grid.length >= 4) {
          const lonField = (grid.charCodeAt(0) - 65) * 20 - 180;
          const latField = (grid.charCodeAt(1) - 65) * 10 - 90;
          const lonSquare = parseInt(grid.charAt(2)) * 2;
          const latSquare = parseInt(grid.charAt(3)) * 1;
          if (!isNaN(lonField) && !isNaN(latField) && !isNaN(lonSquare) && !isNaN(latSquare)) {
            lng = lonField + lonSquare + 1;
            lat = latField + latSquare + 0.5;
          }
        }

        let cleanTime = "—";
        if (timeM) {
          const dateObj = new Date(parseInt(timeM[1]) * 1000);
          cleanTime = dateObj.toISOString().substring(11, 16);
        }

        spots.push({
          receiverCall: receiverCallM[1].toUpperCase().replace(/0/g, "Ø"),
          grid: grid,
          lat: lat,
          lng: lng,
          snr: snrM ? `${snrM[1]} dB` : "0 dB",
          time: cleanTime
        });
      }
    }

    return NextResponse.json({ spots });
  } catch (error: any) {
    console.error("PSK Backend Telemetry Sync Failure:", error.message);
    return NextResponse.json({ error: "Telemetry Offline", spots: [] }, { status: 500 });
  }
}
