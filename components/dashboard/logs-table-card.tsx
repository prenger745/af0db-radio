import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { History } from "lucide-react"

// Sample QSO log data sorted STRICTLY with the most recent contacts first
const qsoLogs = [
  { callsign: "JA1ZLO", date: "2026-05-20", time: "16:42", band: "20m", mode: "FT8", rstS: "+01", rstR: "-05", grid: "PM95" },
  { callsign: "G4ABC", date: "2026-05-20", time: "15:14", band: "20m", mode: "FT8", rstS: "-03", rstR: "+02", grid: "IO91" },
  { callsign: "K6ABC", date: "2026-05-19", time: "23:05", band: "20m", mode: "FT8", rstS: "+00", rstR: "-11", grid: "CM97" },
  { callsign: "ZL2X", date: "2026-05-18", time: "06:12", band: "20m", mode: "FT8", rstS: "-15", rstR: "-18", grid: "RE68" },
  { callsign: "F5OOG", date: "2026-05-15", time: "19:34", band: "20m", mode: "FT8", rstS: "+04", rstR: "-02", grid: "JN24" },
]

export function LogsTableCard() {
  return (
    <Card className="md:col-span-2 lg:col-span-3 border-border bg-card/50 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          Recent QSO Log (Most Recent First)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="border-b border-border/60 text-muted-foreground font-medium text-xs uppercase tracking-wider">
                <th className="py-3 px-4">Callsign</th>
                <th className="py-3 px-4">Date (UTC)</th>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Band</th>
                <th className="py-3 px-4">Mode</th>
                <th className="py-3 px-4 text-center">RST (S/R)</th>
                <th className="py-3 px-4">Grid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {qsoLogs.map((qso, index) => (
                <tr key={index} className="hover:bg-primary/5 transition-colors">
                  <td className="py-3 px-4 font-bold text-primary">{qso.callsign}</td>
                  <td className="py-3 px-4 font-mono text-xs">{qso.date}</td>
                  <td className="py-3 px-4 font-mono text-xs">{qso.time}</td>
                  <td className="py-3 px-4">{qso.band}</td>
                  <td className="py-3 px-4">
                    <span className="bg-primary/10 border border-primary/20 text-primary text-xs px-2 py-0.5 rounded font-mono">
                      {qso.mode}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-xs">
                    <span className="text-emerald-500">{qso.rstS}</span>
                    <span className="text-muted-foreground mx-1">/</span>
                    <span className="text-sky-500">{qso.rstR}</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{qso.grid}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
