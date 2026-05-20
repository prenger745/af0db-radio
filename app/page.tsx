import { Radio } from "lucide-react"
import { StationInfoCard } from "@/components/dashboard/station-info-card"
import { CurrentFrequencyCard } from "@/components/dashboard/current-frequency-card"
import { BandConditionsCard } from "@/components/dashboard/band-conditions-card"
import { SpaceWeatherCard } from "@/components/dashboard/space-weather-card"
import { QsoStatsCard } from "@/components/dashboard/qso-stats-card"
import { LogsTableCard } from "@/components/dashboard/logs-table-card"

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-border pb-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Radio className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                <span className="text-primary">AF0DB</span> Station
              </h1>
              <p className="text-muted-foreground">
                Amateur Radio Dashboard — FT8 / Digital Focus
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-4">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              Monitoring 20M
            </span>
            <span className="text-border">•</span>
            <span className="font-mono">
              {new Date().toISOString().slice(0, 10)} UTC
            </span>
          </div>
        </header>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Row 1 */}
          <div className="lg:row-span-2">
            <StationInfoCard />
          </div>
          <CurrentFrequencyCard />
          <BandConditionsCard />

          {/* Row 2 */}
          <SpaceWeatherCard />
          <QsoStatsCard />

          {/* Row 3 - Full width table */}
          <LogsTableCard />
        </div>

        {/* Footer */}
        <footer className="mt-8 pt-4 border-t border-border">
          <div className="flex flex-col md:flex-row items-center justify-between text-xs text-muted-foreground gap-2">
            <span>73 de AF0DB — Ottawa, Kansas, USA</span>
            <span className="font-mono">Grid: EM28in • CQ Zone: 4 • ITU Zone: 7</span>
          </div>
        </footer>
      </div>
    </main>
  )
}
