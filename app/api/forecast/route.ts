export async function GET() {
  try {
    // Fetch official NOAA 27-day forecast (cached for 1 hour)
    const res = await fetch('https://services.swpc.noaa.gov/text/27-day-forecast.txt', { 
      next: { revalidate: 3600 } 
    });
    const text = await res.text();
    const lines = text.split('\n');
    const forecast = [];
    
    for (const line of lines) {
      // Skip comments and empty lines
      if (line.startsWith('#') || !line.trim()) continue;
      
      // Format: "YYYY MMM DD  SFI  A  Kp_mid... Kp_high... Prob..."
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 5) {
        const dateStr = `${parts[0]} ${parts[1]} ${parts[2]}`;
        const sfi = parseInt(parts[3]) || 70;
        const aIndex = parseInt(parts[4]) || 10;
        
        forecast.push({ date: dateStr, sfi, aIndex });
        
        if (forecast.length === 10) break; // We only need the next 10 days
      }
    }
    
    return Response.json(forecast);
  } catch (error) {
    console.error("Forecast fetch error:", error);
    return Response.json({ error: "Failed to fetch forecast" }, { status: 500 });
  }
}
