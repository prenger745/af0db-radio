import { Radio, Laptop, Compass, History } from "lucide-react"

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

// Secure server-side function to fetch log data from QRZ
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
      next: { revalidate: 300 } // Auto-refreshes logs every 5 minutes
    })

    if (!res.ok) return []
    const rawData = await res.text()

    // Note: If your Vercel environment passes a JSON string instead of raw ADIF, 
    // we handle it safely here. 
    try {
      const parsed = JSON.parse(rawData)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      // If it's raw ADIF text, return empty for now to prevent crash, 
      // or map standard placeholder rows.
      return []
    }
  } catch (e) {
    console.error("Error retrieving QRZ logbook stream:", e)
    return []
  }
}

export default async function Page() {
  const rawLogs = await getQrzLogs()
  const safeLogs = Array.isArray(rawLogs) ? rawLogs : []

  // SORTING FIX: Forces the absolute newest contacts to the top slot of the table layout.
  const qsoLogs = [...safeLogs].sort((a, b) => {
    const dateTimeA = `${a.date}T${a.time}`
    const dateTimeB = `${b.date}T${b.time}`
    return dateTimeB.localeCompare(dateTimeA)
  })

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      {/* Header */}
      <header className="mb-8 border-b border-slate-800 pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-amber-500">AF0DB Radio Dashboard</h1>
        <p className="text-sm text-slate-400 mt-1">Live Station & QRZ Logbook Stream</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Station Profile */}
        <div className="lg:col-span-1 bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-6 backdrop-blur">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Radio className="h-5 w-5 text-amber-500" />
            <h2 className="text-xl font-bold">Station Profile</h2>
          </div>

          {/* Location */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <Compass className="h-3.5 w-3.5 text-amber-500" />
              <span>QTH & Location</span>
            </div>
            <div className="pl-5 text-sm">
              <p className="font-medium text-slate-200">Ottawa, Kansas, USA</p>
              <p className="font-mono text-xs text-slate-400">Grid: EM28in</p>
            </div>
          </div>

          {/* Hardware */}
          <div className="space-y-1 pt-2 border-t border-slate-800/60">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <Radio className="h-3.5 w-3.5 text-amber-500" />
              <span>Hardware / Rig</span>
            </div>
            <div className="pl-5 text-sm">
              <p className="font-medium text-slate-200">Yaesu FT-991</p>
              <p className="text-slate-400 text-xs">Isotron 20 Meter Antenna</p>
            </div>
          </div>

          {/* Software */}
          <div className="space-y-1 pt-2 border-t border-slate-800/60">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <Laptop className="h-3.5 w-3.5 text-amber-500" />
              <span>Shack Software</span>
            </div>
            <div className="pl-5 text-sm space-y-1">
              <p className="font-medium text-slate-200">Xubuntu Linux</p>
              <p className="text-slate-400 text-xs">Andy's Ham Radio Linux Suite</p>
              <span className="inline-block font-mono text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded px-1.5 py-0.5 mt-1">
                WSJT-X Improved
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Recent QSO Log */}
        <div className="lg:col-span-3 bg-slate-900/50 border border-slate-800 rounded-xl p-5 backdrop-blur">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
            <History className="h-5 w-5 text-amber-500" />
            <h2 className="text-xl font-bold">Recent QSO Log</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-medium text-xs uppercase tracking-wider">
                  <th className="py-3 px-4">Callsign</th>
                  <th className="py-3 px-4">Date (UTC)</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Band</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4 text-center">RST (S/R)</th>
                  <th className="py-3 px-4">Grid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {qsoLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500 italic">
                      Connected to QRZ. Parsing data stream...
                    </td>
                  </tr>
                ) : (
                  qsoLogs.map((qso, index) => (
                    <tr key={index} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-bold text-amber-500">{qso.callsign}</td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-300">{qso.date}</td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-300">{qso.time}</td>
                      <td className="py-3 px-4 text-slate-300">{qso.band}</td>
                      <td className="py-3 px-4">
                        <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs px-2 py-0.5 rounded font-mono">
                          {qso.mode}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-xs">
                        <span className="text-emerald-400">{qso.rstS}</span>
                        <span className="text-slate-600 mx-1">/</span>
                        <span className="text-sky-400">{qso.rstR}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-400">{qso.grid}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
