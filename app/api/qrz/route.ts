import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

// HELPER: Translates Maidenhead Grid Squares (e.g., "EM28oo") into exact Dec-Deg Lat/Lng coordinates
function gridToLatLng(grid: string): { lat: number; lng: number } | null {
  if (!grid || grid.trim().length < 4) return null;
  
  const cleanGrid = grid.trim().toUpperCase();
  
  // Calculate main fields (180 deg sectors)
  const lonField = cleanGrid.charCodeAt(0) - 65; // A-R
  const latField = cleanGrid.charCodeAt(1) - 65; // A-R
  
  if (lonField < 0 || lonField > 17 || latField < 0 || latField > 17) return null;
  
  // Calculate squares (10 deg sectors)
  const lonSquare = parseInt(cleanGrid.charAt(2), 10);
  const latSquare = parseInt(cleanGrid.charAt(3), 10);
  
  if (isNaN(lonSquare) || isNaN(latSquare)) return null;
  
  let lng = (lonField * 20) + (lonSquare * 2) - 180;
  let lat = (latField * 10) + latSquare - 90;
  
  // Account for optional sub-squares (2.5m x 5m micro-sectors)
  if (cleanGrid.length >= 6) {
    const lonSub = cleanGrid.charCodeAt(4) - 65;
    const latSub = cleanGrid.charCodeAt(5) - 65;
    if (lonSub >= 0 && lonSub <= 23 && latSub >= 0 && latSub <= 23) {
      lng += (lonSub * (5 / 60)) + (2.5 / 60);
      lat += (latSub * (2.5 / 60)) + (1.25 / 60);
    } else {
      lng += 1;
      lat += 0.5;
    }
  } else {
    lng += 1; // Center on the 4-character grid sector midpoint
    lat += 0.5;
  }
  
  return { lat, lng };
}

export async function GET() {
  try {
    const apiKey = process.env.QRZ_LOGBOOK_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Missing API Key" }, { status: 200 })
    }

    // ADDED EXTENDED=1 parameter to pull ALL logs instead of just the tiny recent cutoff window
    const response = await fetch("https://logbook.qrz.com/api", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `KEY=${encodeURIComponent(apiKey)}&ACTION=FETCH&OPTION=TYPE%3AADIF&EXTENDED=1`,
      cache: "no-store"
    })

    if (!response.ok) {
      return NextResponse.json({ error: `HTTP_ERROR_${response.status}` }, { status: 200 })
    }

    const rawText = await response.text()
    const cleanText = rawText.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

    // SERVER-SIDE PARSING ENGINE
    let adifContent = cleanText.includes("ADIF=") ? cleanText.split(/ADIF=/i)[1] : cleanText;
    const records = adifContent.split(/<eor>/i);
    
    const coordinatesMap: any[] = [];

    for (const record of records) {
      if (!record.trim()) continue;
      
      const extractTag = (tag: string) => {
        const m = record.match(new RegExp(`<${tag}:\\d+>([^<]*)`, "i"));
        return m ? m[1].trim() : "";
      };

      const callsign = extractTag("call").toUpperCase();
      const grid = extractTag("gridsquare");
      const mode = extractTag("mode") || "FT8";

      if (callsign && grid) {
        const loc = gridToLatLng(grid);
        if (loc) {
          coordinatesMap.push({
            callsign,
            mode,
            grid: grid.toUpperCase(),
            lat: loc.lat,
            lng: loc.lng
          });
        }
      }
    }

    // Return the total raw response text block alongside our newly parsed spatial geo map
    return NextResponse.json({ 
      data: rawText,
      geoMap: coordinatesMap
    })
  } catch (error) {
    console.error("Proxy failure:", error)
    return NextResponse.json({ error: "SERVER_EXCEPTION" }, { status: 500 })
  }
}
