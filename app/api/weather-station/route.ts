import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Production keys passed directly from your personal station settings
    const APP_KEY = 'D4AF94B1F953F202D45267C0CE6DD0DE';
    const API_KEY = 'a2e4381b-6c53-47c7-bbb7-4d62831a440a';
    const MAC = '08:3A:8D:FA:47:A9';

    // Ecowitt demands alphabetized matching strings for live endpoints to bypass validation firewalls
    const url = `https://api.ecowitt.net/api/v3/device/current?api_key=${API_KEY}&application_key=${APP_KEY}&call_back=outdoor,wind,rainfall&mac=${MAC}`;

    const res = await fetch(url, { 
      cache: 'no-store',
      headers: { 'Accept': 'application/json' }
    });
    
    if (!res.ok) {
      throw new Error(`Ecowitt Server Connection Aborted: Status Code ${res.status}`);
    }

    const json = await res.json();

    if (json.code !== 0) {
      throw new Error(`Ecowitt Signature Rejected: [Code ${json.code}] ${json.msg}`);
    }

    // Safely extract nested weather values from your rooftop array responses
    const outdoor = json.data?.outdoor || {};
    const wind = json.data?.wind || {};
    const rainfall = json.data?.rainfall || {};

    return NextResponse.json({
      temp: outdoor.temperature?.value !== undefined ? outdoor.temperature.value : "——",
      humidity: outdoor.humidity?.value !== undefined ? outdoor.humidity.value : "——",
      windSpeed: wind.wind_speed?.value !== undefined ? wind.wind_speed.value : "——",
      windDir: wind.wind_direction?.value !== undefined ? wind.wind_direction.value : "——",
      rainRate: parseFloat(rainfall.rain_rate?.value || "0")
    });

  } catch (error: any) {
    console.error("🚨 Proxy Handshake Exception:", error.message);
    return NextResponse.json({ error: error.message || "Link Down" }, { status: 500 });
  }
}
