import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const APP_KEY = 'D4AF94B1F953F202D45267C0CE6DD0DE';
    const API_KEY = 'a2e4381b-6c53-47c7-bbb7-4d62831a440a';
    const MAC = '08:3A:8D:FA:47:A9';

    const url = `https://api.ecowitt.net/api/v3/device/current?application_key=${APP_KEY}&api_key=${API_KEY}&mac=${MAC}&call_back=outdoor,wind`;

    const res = await fetch(url, { cache: 'no-store' });
    const json = await res.json();

    if (json.code !== 0) {
      throw new Error(json.msg || "Ecowitt API failure");
    }

    const outdoor = json.data?.outdoor || {};
    const wind = json.data?.wind || {};

    // Package the raw values cleanly for our layout UI
    return NextResponse.json({
      temp: outdoor.temperature?.value || "——",
      humidity: outdoor.humidity?.value || "——",
      windSpeed: wind.wind_speed?.value || "——",
      windDir: wind.wind_direction?.value || "——",
      rainRate: parseFloat(json.data?.rainfall?.rain_rate?.value || "0")
    });

  } catch (error: any) {
    console.error("Ecowitt Proxy Error:", error.message);
    return NextResponse.json({ error: "PWS Telemetry Link Offline" }, { status: 500 });
  }
}
