import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Verified production credentials provided from your Ecowitt spreadsheet script
    const APP_KEY = 'D4AF94B1F953F202D45267C0CE6DD0DE';
    const API_KEY = 'a2e4381b-6c53-47c7-bbb7-4d62831a440a';
    const MAC = '08:3A:8D:FA:47:A9';

    const url = `https://api.ecowitt.net/api/v3/device/current?application_key=${APP_KEY}&api_key=${API_KEY}&mac=${MAC}&call_back=outdoor,wind,rainfall`;

    const res = await fetch(url, { cache: 'no-store' });
    const json = await res.json();

    // Check Ecowitt server status return value
    if (json.code !== 0) {
      throw new Error(json.msg || "Ecowitt API returned an error code");
    }

    const outdoor = json.data?.outdoor || {};
    const wind = json.data?.wind || {};
    const rainfall = json.data?.rainfall || {};

    // Package the raw values safely into a clean JSON object for your page.tsx layout
    return NextResponse.json({
      temp: outdoor.temperature?.value || "——",
      humidity: outdoor.humidity?.value || "——",
      windSpeed: wind.wind_speed?.value || "——",
      windDir: wind.wind_direction?.value || "——",
      rainRate: parseFloat(rainfall.rain_rate?.value || "0")
    });

  } catch (error: any) {
    console.error("Ecowitt Proxy Error Log:", error.message);
    return NextResponse.json({ error: "PWS Telemetry Link Offline" }, { status: 500 });
  }
}
