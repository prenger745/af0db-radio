"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { History, Loader2, AlertCircle } from "lucide-react"

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

export function LogsTableCard() {
  const [qsoLogs, setQsoLogs] = useState<QSO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchLogs() {
      try {
        // Calls the internal Vercel API route that safely communicates with QRZ
        const response = await fetch("/api/qrz-logs")
        if (!response.ok) throw new Error("Failed to fetch QRZ logbook data")
        
        const data = await response.ok ? await response.json() : []
        
        // CRITICAL FIX: Take the raw QRZ stream and reverse it so the newest logs display first
        const sortedLogs = Array.isArray(data) ? [...data].reverse() : []
        
        setQsoLogs(sortedLogs)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error connecting to QRZ")
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
  }, [])

  return (
    <Card className="md:col-span-2 lg:col-span-3 border-border bg-card/50 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          Recent QSO Log
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>Retrieving live logbook from QRZ.com...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 py-6 text-sm text-destructive justify-center bg-destructive/5 rounded-lg border border-destructive/10">
            <AlertCircle className="h-4 w-4" />
            <span>{error}. Check your Vercel Environment Variables.</span>
          </div>
        )}

        {!loading && !error && (
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
                {qsoLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground italic">
                      No recent contacts found in logbook.
                    </td>
                  </tr>
                ) : (
                  qsoLogs.map((qso, index) => (
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
