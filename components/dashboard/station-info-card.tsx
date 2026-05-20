import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Laptop, Radio, Compass, ShieldAlert } from "lucide-react"

export function StationInfoCard() {
  return (
    <Card className="h-full border-border bg-card/50 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <Radio className="h-5 w-5 text-primary" />
          Station Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Location Section */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Compass className="h-4 w-4 text-primary" />
            <span>QTH & Location</span>
          </div>
          <div className="pl-6 space-y-0.5 text-sm">
            <p className="text-foreground font-medium">Ottawa, Kansas, USA</p>
            <p className="font-mono text-xs text-muted-foreground">Grid Square: EM28in</p>
            <p className="font-mono text-xs text-muted-foreground">CQ Zone 4 • ITU Zone 7</p>
          </div>
        </div>

        {/* Rig / Hardware Section */}
        <div className="space-y-1.5 border-t border-border/40 pt-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Radio className="h-4 w-4 text-primary" />
            <span>Hardware / Rig</span>
          </div>
          <div className="pl-6 space-y-0.5 text-sm">
            <p className="text-foreground font-medium">Yaesu FT-991</p>
            <p className="text-muted-foreground text-xs">Isotron 20 Meter Antenna</p>
          </div>
        </div>

        {/* Software / OS Section */}
        <div className="space-y-1.5 border-t border-border/40 pt-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Laptop className="h-4 w-4 text-primary" />
            <span>Shack Software & OS</span>
          </div>
          <div className="pl-6 space-y-0.5 text-sm">
            <p className="text-foreground font-medium">Xubuntu Linux</p>
            <p className="text-muted-foreground text-xs">Andy's Ham Radio Linux Suite</p>
            <p className="font-mono text-xs text-primary bg-primary/5 border border-primary/10 rounded px-1.5 py-0.5 inline-block mt-1">
              WSJT-X Improved
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
