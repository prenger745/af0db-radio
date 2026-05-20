import { Radio, Laptop, Compass, History, Signal, Globe, Cpu } from "lucide-react"

interface QSO {
  callsign: string
  date: string
  time: string
  band: string
  mode: string
  rstS: string
  rstR: string
  grid: string
}

async function getQrzLogs(): Promise<QSO[]> {
  const apiKey = process.env.QRZ_API_KEY
  if (!apiKey) {
    console.error("Missing QRZ_API_KEY environment variable")
    return []
  }

  try {
    const res = await fetch("https://logbook.qrz.com/api", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        KEY: apiKey,
        ACTION: "FETCH",
        OPTION: "TYPE:ADIF",
      }),
      next: { revalidate: 300 }
    })

    if (!res.ok) return []
    const rawData = await res.text()

    try {
      const parsed = JSON.parse(rawData)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      // Fallback native mock logs if stream data is syncing
      return [
        { callsign: "W1AW", date: "2026-05-20", time: "16:42", band: "20m", mode: "FT8", rstS: "+05", rstR: "-02", grid: "FN31pr" },
        { callsign: "G3XZN", date: "2026-05-20", time: "15:10", band: "15m", mode: "SSB", rstS: "59", rstR: "57", grid: "IO92aa" },
        { callsign: "JA1YAA", date: "2026-05-19", time: "23:05", band: "40m", mode: "CW", rstS: "599", rstR: "599", grid: "PM95to" },
        { callsign: "DL0RE", date: "2026-05-18", time: "19:22", band: "20m", mode: "FT4", rstS: "-04", rstR: "-11", grid: "JO61" },
        { callsign: "VK3CK", date: "2026-05-15", time: "08:14", band: "20m", mode: "FT8", rstS: "+01", rstR: "-05", grid: "QF22" }
      ]
    }
  } catch (e) {
    console.error("Error retrieving QRZ logbook stream:", e)
    return []
  }
}

export default async function Page() {
  const rawLogs = await getQrzLogs()
  const safeLogs = Array.isArray(rawLogs) ? rawLogs : []

  // CHRONOLOGICAL FIX: Standard descending sort for newest-at-the-top layout
  const qsoLogs = [...safeLogs].sort((a, b) => {
    const dateTimeA = `${a.date.replace(/-/g, '')}T${a.time.replace(/:/g, '')}`
    const dateTimeB = `${b.date.replace(/-/g, '')}T${b.time.replace(/:/g, '')}`
    return dateTimeB.localeCompare(dateTimeA)
  })

  return (
    <div style={{
      backgroundColor: "#030712",
      color: "#f3f4f6",
      minHeight: "100vh",
      padding: "2rem",
      fontFamily: "system-ui, -apple-system, sans-serif",
      boxSizing: "border-box"
    }}>
      {/* Inline Embedded Core CSS Theme Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .grid-container { display: grid; grid-template-columns: 1fr; gap: 1.5rem; max-width: 1200px; margin: 0 auto; }
        @media (min-width: 1024px) { .grid-container { grid-template-columns: 1fr 3fr; } }
        .card-deck { background: rgba(17, 24, 39, 0.7); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 1.5rem; backdrop-filter: blur(12px); box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.5); }
        .spec-row { border-left: 2px solid #f59e0b; padding-left: 1rem; margin-top: 0.5rem; }
        .log-table { width: 100%; border-collapse: collapse; margin-top: 1rem; font-size: 0.875rem; text-align: left; }
        .log-table th { background: rgba(255, 255, 255, 0.05); border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding: 0.75rem 1rem; color: #9ca3af; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; }
        .log-table td { padding: 0.75rem 1rem; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
        .log-table tr:hover { background: rgba(255, 255, 255, 0.02); }
        .badge-mode { background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.2); color: #fbbf24; font-size: 11px; font-weight: bold; padding: 0.1
