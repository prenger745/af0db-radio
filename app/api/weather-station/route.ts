import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const APP_KEY = 'D4AF94B1F953F202D45267C0CE6DD0DE';
    const API_KEY = 'a2e4381b-6c53-47c7-bbb7-4d62831a440a';
    const MAC = '08:3A:8D:FA:47:A9';

    // Upgraded call_back=all to unlock solar_and_uvi, pressure, and gust data structures
    const url = `https://api.ecowitt.net/api/v3/device/real_time?application_key=${APP_KEY}&api_key=${API_KEY}&mac=${MAC}&call_back=all`;

    const res = await fetch(url, {
      cache: 'no-store',
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Ecowitt Connection Error: ${res.status}` }, { status: res.status });
    }

    const json = await res.json();

    if (json.code !== 0) {
      return NextResponse.json({ error: json.msg || 'Ecowitt rejected handshake specifications' }, { status: 400 });
    }

    const outdoor = json.data?.outdoor || {};
    const wind = json.data?.wind || {};
    const pressure = json.data?.pressure || {};
    const solarAndUvi = json.data?.solar_and_uvi || {};

    // Aggressive Data Hunter: Catches the value regardless of Ecowitt's naming convention
    const rawSolar = solarAndUvi.solar?.value ?? solarAndUvi.solar_radiation?.value ?? json.data?.solar?.value ?? "——";
    const rawUvi = solarAndUvi.uvi?.value ?? solarAndUvi.uv?.value ?? json.data?.uvi?.value ?? "0";

    return NextResponse.json({
      temp: outdoor.temperature?.value?.toString() ?? "——",
      humidity: outdoor.humidity?.value?.toString() ?? "——",
      windSpeed: wind.wind_speed?.value?.toString() ?? "0",
      windDir: wind.wind_direction?.value?.toString() ?? "0",
      baro: pressure.relative?.value?.toString() ?? "——",
      solRad: rawSolar.toString(),
      uvi: rawUvi.toString()
    });

  } catch (error: any) {
    console.error("Ecowitt Advanced Proxy Error:", error);
    return NextResponse.json({ error: "Failed to compile complete instrument string payload" }, { status: 500 });
  }
}
