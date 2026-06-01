import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const APP_KEY = 'D4AF94B1F953F202D45267C0CE6DD0DE';
    const API_KEY = 'a2e4381b-6c53-47c7-bbb7-4d62831a440a';
    const MAC = '08:3A:8D:FA:47:A9';

    // Grok's corrected endpoint verification structure using real_time syntax paths
    const url = `https://api.ecowitt.net/api/v3/device/real_time?application_key=${APP_KEY}&api_key=${API_KEY}&mac=${MAC}&call_back=outdoor,wind,rainfall`;

    const res = await fetch(url, {
      cache: 'no-store',
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Ecowitt API server responded with error: ${res.status}` },
        { status: res.status }
      );
    }

    const json = await res.json();

    if (json.code !== 0) {
      return NextResponse.json(
        { error: json.msg || 'Ecowitt server dropped authentication routing guidelines' },
        { status: 400 }
      );
    }

    const outdoor = json.data?.outdoor || {};
    const wind = json.data?.wind || {};
    const rainfall = json.data?.rainfall || {};

    // Standard fallback strings explicitly matched to look up your page.tsx layout tags
    return NextResponse.json({
      temp: outdoor.temperature?.value?.toString() ?? "——",
      humidity: outdoor.humidity?.value?.toString() ?? "——",
      windSpeed: wind.wind_speed?.value?.toString() ?? "0",
      windDir: wind.wind_direction?.value?.toString() ?? "0",
      rainRate: parseFloat(rainfall.rain_rate?.value ?? "0"),
    });

  } catch (error: any) {
    console.error("Ecowitt Proxy Error Trace:", error);
    return NextResponse.json(
      { error: "Internal socket configuration failure track" },
      { status: 500 }
    );
  }
}
