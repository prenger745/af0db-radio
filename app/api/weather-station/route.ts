import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Target configuration keys extracted from your verified Google script logs
    const APP_KEY = 'D4AF94B1F953F202D45267C0CE6DD0DE';
    const API_KEY = 'a2e4381b-6c53-47c7-bbb7-4d62831a440a';
    const MAC = '08:3A:8D:FA:47:A9';

    // Querying the real-time node. Note: parameters are ordered strictly to match Ecowitt signature logic.
    const url = `https://api.ecowitt.net/api/v3/device/current?api_key=${API_KEY}&application_key=${APP_KEY}&call_back=outdoor,wind,rainfall&mac=${MAC}`;

    const res = await fetch(url, { 
      cache: 'no-store',
      headers: { 'Accept': 'application/json' }
    });
    
    if (!res.ok) {
      return NextResponse.json({ error: `Server response failure status: ${res.status}` });
    }

    const json = await res.json();

    // Catch authorization rejections or invalid MAC routing codes natively
    if (!json || json.code !== 0) {
      return NextResponse.json({ error: json?.msg || "Ecowitt authorization rejected mapping criteria." });
    }

    // Defensive parsing array: ensures the server never throws an unhandled 'undefined' crash
    const outdoor = json.data?.outdoor || {};
    const wind = json.data?.wind || {};
    const rainfall = json.data?.rainfall || {};

    // Standardize zero-fallbacks if sensors are in a low-power state or wind is dead calm
    const currentTemp = outdoor.temperature?.value !== undefined ? outdoor.temperature.value : "——";
    const currentHumidity = outdoor.humidity?.value !== undefined ? outdoor.humidity.value : "——";
    const currentWindSpeed = wind.wind_speed?.value !== undefined ? wind.wind_speed.value : "0";
    const currentWindDir = wind.wind_direction?.value !== undefined ? wind.wind_direction.value : "0";
    const currentRainRate = parseFloat(rainfall.rain_rate?.value || "0");

    // Package safe string data primitives directly to eliminate parsing format conflicts on page.tsx
    return NextResponse.json({
      temp: currentTemp.toString(),
      humidity: currentHumidity.toString(),
      windSpeed: currentWindSpeed.toString(),
      windDir: currentWindDir.toString(),
      rainRate: currentRainRate
    });

  } catch (error: any) {
    console.error("🚨 Proxy Handshake Error Trace:", error.message);
    return NextResponse.json({ error: "Local network socket trace dropped completely." });
  }
}
