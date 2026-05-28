import { NextResponse } from 'next/server';

// MAIDENHEAD GRID TO COORDINATE TRANSLATOR
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
  
  // Queries the trailing 2 hours (-7200s) to guarantee a thick, persistent signal heatmap
  const targetUrl = `https://pskreporter.info/cgi-bin/pskdata.pl?senderCallsign=${callsign}&flowStartSeconds=-7200`;

  try {
    const res = await fetch(targetUrl, { 
      headers: { 
        // Spoofing standard browser headers to bypass strict IP/Bot filters on the PSK backend
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/xml, text/xml, */*"
      },
      next: { revalidate: 60 } 
    });

    if (!res.ok) {
      throw new Error(`PSK Reporter API returned status: ${res.status}`);
    }

    const xmlData = await res.text();

    // BULLETPROOF REGEX PARSER: Extracts the node regardless of self-closing slashes or line breaks
    const reportMatches = xmlData.match(/<receptionReport\b[^>]*>/ig) || [];
    
    const liveSpots = [];

    for (const report of reportMatches) {
      const extractAttr = (attr: string) => {
        // Broadened regex to capture standard XML attribute structures dynamically
        const m = report.match(new RegExp(`${attr}\\s*=\\s*"([^"]*)"`, "i"));
        return m ? m[1] : "";
      };

      const receiverCall = extractAttr("receiverCallsign");
      const grid = extractAttr("receiverLocator");
      const snr = extractAttr("sNR");
      const flowSeconds = extractAttr("flowStartSeconds");
      
      if (!receiverCall || !grid) continue;

      const coords = gridToLatLon(grid);
      if (!coords) continue;

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

    // Filters down to unique stations, preferring their most recent decode
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
      .slice(0, 20); // Upped the render limit to capture more of your signal spread

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
