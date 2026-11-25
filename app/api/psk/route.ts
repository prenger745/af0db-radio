import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface PskSpot {
  receiverCall: string;
  grid: string;
  lat: number;
  lng: number;
  snr: string;
  time: string;
}

const pskCache = new Map<string, { timestamp: number; spots: PskSpot[] }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

function gridToLatLng(grid: string): { lat: number; lng: number } | null {
  if (!grid || grid.length < 4) return null;
  const g = grid.toUpperCase();
  const lonField = (g.charCodeAt(0) - 65) * 20 - 180;
  const latField = (g.charCodeAt(1) - 65) * 10 - 90;
  const lonSquare = parseInt(g.charAt(2), 10) * 2;
  const latSquare = parseInt(g.charAt(3), 10) * 1;

  if (
    isNaN(lonField) ||
    isNaN(latField) ||
    isNaN(lonSquare) ||
    isNaN(latSquare)
  ) {
    return null;
  }

  let lng = lonField + lonSquare + 1;
  let lat = latField + latSquare + 0.5;

  if (g.length >= 6) {
    const lonSub = (g.charCodeAt(4) - 65) * (2 / 24);
    const latSub = (g.charCodeAt(5) - 65) * (1 / 24);
    if (!isNaN(lonSub) && !isNaN(latSub)) {
      lng = lonField + lonSquare + lonSub + 1 / 24;
      lat = latField + latSquare + latSub + 1 / 48;
    }
  }

  return { lat, lng };
}

function getAttr(tag: string, name: string): string {
  const match = tag.match(new RegExp(`${name}=["']([^"']*)["']`, "i"));
  return match ? match[1].trim() : "";
}

async function fetchPskXml(callsign: string): Promise<{
  ok: boolean;
  status: number;
  source: string;
  xml: string;
}> {
  const formBody = new URLSearchParams({
    senderCallsign: callsign,
    flowStartSeconds: "-21600",
    rronly: "1",
    noactive: "1",
    rptlimit: "50",
    appcontact: "af0db@af0db.radio",
  }).toString();

  const browserHeaders = {
    "User-Agent":
      "Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0",
    Accept: "application/xml,text/xml,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    Referer: "https://pskreporter.info/pskmap.html",
    Origin: "https://pskreporter.info",
  };

  // Attempt 1: HTTP POST to retrieve.pskreporter.info/query
  const attempts: Array<{ name: string; run: () => Promise<Response> }> = [
    {
      name: "post-retrieve",
      run: () =>
        fetch("https://retrieve.pskreporter.info/query", {
          method: "POST",
          cache: "no-store",
          headers: {
            ...browserHeaders,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formBody,
        }),
    },
    {
      name: "get-pskquery5",
      run: () =>
        fetch(`https://pskreporter.info/cgi-bin/pskquery5.pl?${formBody}`, {
          method: "GET",
          cache: "no-store",
          headers: browserHeaders,
        }),
    },
  ];

  let lastStatus = 0;
  let lastSource = "none";

  for (const attempt of attempts) {
    lastSource = attempt.name;
    try {
      const res = await attempt.run();
      lastStatus = res.status;
      if (res.ok) {
        const xml = await res.text();
        if (xml.includes("receptionReport") || xml.includes("receptionReports")) {
          return { ok: true, status: res.status, source: attempt.name, xml };
        }
      }
    } catch {
      lastStatus = 0;
    }
  }

  return { ok: false, status: lastStatus, source: lastSource, xml: "" };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const callsign = (searchParams.get("callsign") || "AF0DB")
    .toUpperCase()
    .replace(/[^A-Z0-9/]/g, "");

  const now = Date.now();
  const cached = pskCache.get(callsign);
  if (cached && cached.spots.length > 0 && now - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(
      { spots: cached.spots, cached: true },
      {
        status: 200,
        headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" },
      }
    );
  }

  const result = await fetchPskXml(callsign);

  if (!result.ok) {
    return NextResponse.json(
      {
        spots: cached?.spots || [],
        debug: {
          upstreamStatus: result.status,
          source: result.source,
          callsign,
        },
      },
      { status: 200 }
    );
  }

  const reportMatches = result.xml.match(/<receptionReport\b[^>]*\/?>/gi) || [];
  const seen = new Set<string>();
  const spots: PskSpot[] = [];

  for (const tag of reportMatches) {
    const receiverCall = getAttr(tag, "receiverCallsign").toUpperCase();
    const grid = getAttr(tag, "receiverLocator").toUpperCase();
    const snrRaw = getAttr(tag, "sNR");
    const flowStart = parseInt(getAttr(tag, "flowStartSeconds"), 10);

    if (!receiverCall || seen.has(receiverCall)) continue;
    seen.add(receiverCall);

    const coords = gridToLatLng(grid) || { lat: 39.8283, lng: -98.5795 };
    const snrNum = parseInt(snrRaw, 10);
    const snr = isNaN(snrNum)
      ? "—"
      : `${snrNum > 0 ? "+" : ""}${snrNum} dB`;

    const time = !isNaN(flowStart)
      ? new Date(flowStart * 1000).toISOString().substring(11, 16) + "Z"
      : "—";

    spots.push({
      receiverCall,
      grid: grid || "—",
      lat: coords.lat,
      lng: coords.lng,
      snr,
      time,
    });
  }

  if (spots.length > 0) {
    pskCache.set(callsign, { timestamp: now, spots });
  }

  return NextResponse.json(
    {
      spots,
      cached: false,
      debug: {
        upstreamStatus: result.status,
        source: result.source,
        rawReports: reportMatches.length,
      },
    },
    {
      status: 200,
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" },
    }
  );
}
