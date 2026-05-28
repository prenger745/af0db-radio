import { NextResponse } from 'next/server';

// MAIDENHEAD GRID TO COORDINATE TRANSLATOR: Converts 4 or 6 character grids (e.g. EM28) into Lat/Lng decimals for the 3D globe
function gridToLatLon(grid: string): { lat: number, lng: number } | null {
  if (!grid || grid.length < 4) return null;
  const g = grid.toUpperCase();
  
  let lon = (g.charCodeAt(0) - 65) * 20 - 180;
  let lat = (g.charCodeAt(1) - 65) * 10 - 90;
  
  lon += parseInt(g.charAt(2)) * 2;
  lat += parseInt(g.charAt(3)) * 1;
  
  if (g.length >= 6) {
    lon += (g.charCodeAt(4) - 65) * (5 / 60);
    lat += (g.charCodeAt(5) - 65) * (2.5 / 60);
    lon += (5 / 120); 
    lat += (2.5 / 120);
  } else {
    lon += 1;
    lat += 0.5;
  }
  
  return { lat, lng: lon };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const callsign = searchParams.get("callsign") || "AF0DB";
  
  // SECURE BACKEND QUERY: Fetches all remote decodes of your signal from the last 3600 seconds (1 hour)
  const targetUrl = `https://pskreporter.info/cgi-bin/pskdata.pl?senderCallsign=${callsign}&flowStartSeconds=-3600`;

  try {
    const res = await fetch(targetUrl, { 
      headers: { 
        "User-Agent": "AF0DB-Tactical-Dashboard/1.0",
        "Accept": "application/xml"
      },
      next: { revalidate: 60 } // Instructs Vercel to cache this edge query for 60 seconds to prevent rate-limiting bans
    });

    if (!res.ok) {
      throw new Error(`PSK Reporter API returned status: ${res.status}`);
    }

    const xmlData = await res.text();

    // REGEX XML PARSER: Extracts individual <receptionReport> nodes from the raw database dump
    const reportMatches = xmlData.match(/<receptionReport[^>]*\/>/g) || [];
    
    const liveSpots = [];

    for (const report of reportMatches) {
      const extractAttr = (attr: string) => {
        const m = report.match(new RegExp(`${attr}="([^"]*)"`, "i"));
        return m ? m[1] : "";
      };

      const receiverCall = extractAttr("receiverCallsign");
      const grid = extractAttr("receiverLocator");
      const snr = extractAttr("sNR");
      const flowSeconds = extractAttr("flowStartSeconds");
      
      if (!receiverCall || !grid) continue;

      const coords = gridToLatLon(grid);
      if (!coords) continue;

      // TIME DIFFERENTIAL CALCULATOR: Converts absolute Unix epoch stamps into localized "Xm ago" tags
      let timeString = "Just now";
      if (flowSeconds) {
        const reportTime = parseInt(flowSeconds) * 1000;
        const diffMinutes = Math.floor((Date.now() - reportTime) / 60000);
        if (diffMinutes > 0) {
          timeString = `${diffMinutes}m ago`;
        }
      }

      liveSpots.push({
        receiverCall: receiverCall.toUpperCase(),
        grid: grid.toUpperCase(),
        lat: coords.lat,
        lng: coords.lng,
        snr: snr ? `${snr} dB` : "—",
        time: timeString
      });
    }

    // DUPLICATE NODE FILTER: If a station decodes you 5 times in an hour, this condenses it to their most recent single spot
    const uniqueSpotsMap = new Map();
    liveSpots.forEach(spot => {
      uniqueSpotsMap.set(spot.receiverCall, spot);
    });

    const finalUniqueSpots = Array.from(uniqueSpotsMap.values())
      .sort((a, b) => {
        const aTime = parseInt(a.time.replace(/\D/g, '')) || 0;
        const bTime = parseInt(b.time.replace(/\D/g, '')) || 0;
        return aTime - bTime;
      })
      .slice(0, 15); // Limits the render array to the 15 most recent decodes to keep UI scrolling clean

    return NextResponse.json({
      active: true,
      count: finalUniqueSpots.length,
      spots: finalUniqueSpots
    });

  } catch (error: any) {
    console.error("PSK Reporter Sync Error:", error.message);
    return NextResponse.json({ active: false, error: "Link Down", spots: [] }, { status: 500 });
  }
}
