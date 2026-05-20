"use client";

import React, { useEffect, useState } from "react"
import { Radio, Laptop, Compass, History, Signal, Globe, Cpu, Award, Zap, Activity, ShieldCheck, Database, Sliders, ChevronRight } from "lucide-react"

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

interface StationMetrics {
  totalQsos: string
  confirmed: string
  dxcc: string
  currentBand: string
  currentMode: string
}

export default function Page() {
  const [logs, setLogs] = useState<QSO[]>([])
  const [stats, setStats] = useState<StationMetrics>({
    totalQsos: "1,008",
    confirmed: "792",
    dxcc: "74",
    currentBand: "20 Meters",
    currentMode: "FT8"
  })
  const [loading, setLoading] = useState(true)
  const [isLiveStream, setIsLiveStream] = useState(false)

  useEffect(() => {
    async function parseLiveQrzData() {
      try {
        const res = await fetch("/api/qrz")
        if (!res.ok) throw new Error("Proxy offline")
        const json = await res.json()
        
        if (json.error || !json.data) throw new Error(json.error || "No data received")
        const rawText = json.data

        const cleanText = rawText
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&amp;/g, "&")

        const countMatch = cleanText.match(/COUNT=([^&]*)/i) || cleanText.match(/"COUNT":"(\d+)"/i)
        const confMatch = cleanText.match(/CONFIRMED=([^&]*)/i) || cleanText.match(/"CONFIRMED":"(\d+)"/i)
        const dxccMatch = cleanText.match(/DXCC_COUNT=([^&]*)/i) || cleanText.match(/"DXCC_COUNT":"(\d+)"/i)

        const liveCount = countMatch ? countMatch[1].split('&')[0] : "1,008"
        const liveConfirmed = confMatch ? confMatch[1].split('&')[0] : "792"
        const liveDxcc = dxccMatch ? dxccMatch[1].split('&')[0] : "74"

        let adifContent = ""
        const adifKeyMatch = cleanText.match(/ADIF=([\s\S]*)$/i)
        if (adifKeyMatch) {
          adifContent = adifKeyMatch[1]
        } else {
          adifContent = cleanText
        }

        const parsedLogs: QSO[] = []
        const records = adifContent.split(/<eor>/i)

        for (const record of records) {
          if (!record.trim()) continue

          const extractTagValue = (tag: string) => {
            const regex = new RegExp(`<${tag}:\\d+>([^<]*)`, "i")
            const match = record.match(regex)
            return match ? match[1].trim() : ""
          }

          const callsign = extractTagValue("call")
          if (!callsign) continue

          const rawDate = extractTagValue("qso_date")
          const formattedDate = rawDate.length === 8 
            ? `${rawDate.substring(0, 4)}-${rawDate.substring(4, 6)}-${rawDate.substring(6, 8)}`
            : rawDate

          const rawTime = extractTagValue("time_on")
          const formattedTime = rawTime.length >= 4 
            ? `${rawTime.substring(0, 2)}:${rawTime.substring(2, 4)}`
            : rawTime

          // Convert any 0 in incoming callsigns to a slashed Ø automatically for consistency
          let displayCall = callsign.toUpperCase()
          if (displayCall.includes("0")) {
            displayCall = displayCall.replace(/0/g, "Ø")
          }

          parsedLogs.push({
            callsign: displayCall,
            date: formattedDate,
            time: formattedTime,
            band: extractTagValue("band") || "—",
            mode: extractTagValue("mode") || "—",
            rstS: extractTagValue("rst_sent") || "59",
            rstR: extractTagValue("rst_rcvd") || "59",
            grid: extractTagValue("gridsquare") || "—"
          })
        }

        const sortedLogs = parsedLogs.sort((a, b) => {
          const dateTimeA = `${a.date.replace(/-/g, '')}T${a.time.replace(/:/g, '')}`
          const dateTimeB = `${b.date.replace(/-/g, '')}T${b.time.replace(/:/g, '')}`
          return dateTimeB.localeCompare(dateTimeA)
        })

        if (sortedLogs.length > 0) {
          const newestFifteen = sortedLogs.slice(0, 15)
          setLogs(newestFifteen)
          setIsLiveStream(true)
          setStats({
            totalQsos: liveCount,
            confirmed: liveConfirmed,
            dxcc: liveDxcc,
            currentBand: newestFifteen[0].band ? `${newestFifteen[0].band} Meters` : "20 Meters",
            currentMode: newestFifteen[0].mode || "FT8"
          })
        }
      } catch (err) {
        console.warn("Backend parsing hold state triggered:", err)
      } finally {
        setLoading(false)
      }
    }

    parseLiveQrzData()
  }, [])

  return (
    <div style={{
      backgroundColor: "#0a0a0a",
      color: "#e5e5e5",
      minHeight: "100vh",
      padding: "1.5rem",
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      boxSizing: "border-box",
      letterSpacing: "0.01em"
    }}>
      <style dangerouslySetInnerHTML={{__html: `
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .telemetry-strip { display: grid; grid-template-columns: repeat(1, 1fr); gap: 1rem; margin-bottom: 1rem; }
        @media (min-width: 640px) { .telemetry-strip { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 1024px) { .telemetry-strip { grid-template-columns: repeat(4, 1fr); } }
        .deck-workspace { display: grid; grid-template-columns: 1fr; gap: 1.5rem; }
        @media (min-width: 1024px) { .deck-workspace { grid-template-columns: 320px 1fr; } }
        .terminal-panel { background: #121212; border: 1px solid #262626; border-radius: 8px; padding: 1.25rem; position: relative; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2); }
        .panel-header { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #262626; padding-bottom: 0.75rem; margin-bottom: 1rem; }
        .panel-title { font-size: 0.8rem; font-weight: 700; text-transform: uppercase; color: #f59e0b; letter-spacing: 0.05em; display: flex; align-items: center; gap: 0.5rem; }
        .data-row { display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0; border-bottom: 1px solid #1f1f1f; font-size: 0.85rem; }
        .data-label { color: #a3a3a3; text-transform: uppercase; display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; font-weight: 500; }
        .data-value { color: #ffffff; font-weight: 600; }
        .matrix-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; text-align: left; }
        .matrix-table th { background: #171717; border-bottom: 2px solid #262626; padding: 0.75rem 1rem; color: #a3a3a3; text-transform: uppercase; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.03em; }
        .matrix-table td { padding: 0.75rem 1rem; border-bottom: 1px solid #1f1f1f; color: #d4d4d4; }
        .matrix-table tr:nth-child(even) { background: #161616; }
        .matrix-table tr:hover { background: #1f1f1f; }
        .txt-neon-green { color: #10b981; }
        .txt-aviation-blue { color: #06b6d4; }
        .status-bracket { font-size: 0.75rem; color: #525252; font-weight: 600; }
        .status-text { color: #10b981; font-weight: 700; padding: 0 0.25rem; }
        .badge-mode-tactical { border: 1px solid #f59e0b; color: #f59e0b; font-size: 11px; font-weight: 700; padding: 0.15rem 0.5rem; border-radius: 4px; background: rgba(245,158,11,0.08); letter-spacing: 0.02em; }
        .rst-s-box { color: #10b981; font-weight: 600; font-family: monospace; font-size: 0.9rem; }
        .rst-r-box { color: #06b6d4; font-weight: 600; font-family: monospace; font-size: 0.9rem; }
        .font-mono-data { font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-weight: 600; }
      `}} />

      {/* Header Banner */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #262626", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#f59e0b", display: "flex", alignItems: "center", gap: "0.6rem", letterSpacing: "-0.01em" }}>
            <Radio style={{ width: "20px", height: "20px" }} /> DANIEL McGURK // AFØDB STATION LOG
          </h1>
          <p style={{ fontSize: "0.7rem", color: "#737373", marginTop: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 500 }}>
            Real-Time QRZ API Live Data Stream // Connected
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <span className="status-bracket">[<span className="status-text">{loading ? "SYNCING" : "SYS_OK"}</span>]</span>
          <span className="status-bracket">[<span className="status-text" style={{ color: "#f59e0b" }}>{isLiveStream ? "LIVE_FEED" : "STANDBY"}</span>]</span>
        </div>
      </header>

      {/* Cyber-Deck Telemetry Cards */}
      <section className="telemetry-strip">
        <div className="terminal-panel" style={{ padding: "1rem 1.25rem" }}>
          <span style={{ fontSize: "0.7rem", color: "#737373", textTransform: "uppercase", display: "block", fontWeight: 600, letterSpacing: "0.05em" }}>01/ ACTIVE_BAND</span>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#ffffff", marginTop: "0.25rem" }}>{stats.currentBand}</div>
        </div>
        <div className="terminal-panel" style={{ padding: "1rem 1.25rem" }}>
          <span style={{ fontSize: "0.7rem", color: "#737373", textTransform: "uppercase", display: "block", fontWeight: 600, letterSpacing: "0.05em" }}>02/ RIG_MODE</span>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#f59e0b", marginTop: "0.25rem" }}>{stats.currentMode}</div>
        </div>
        <div className="terminal-panel" style={{ padding: "1rem 1.25rem" }}>
          <span style={{ fontSize: "0.7rem", color: "#737373", textTransform: "uppercase", display: "block", fontWeight: 600, letterSpacing: "0.05em" }}>03/ TOTAL_QSO_COUNT</span>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#10b981", marginTop: "0.25rem" }}>{stats.totalQsos}</div>
        </div>
        <div className="terminal-panel" style={{ padding: "1rem 1.25rem" }}>
          <span style={{ fontSize: "0.7rem", color: "#737373", textTransform: "uppercase", display: "block", fontWeight: 600, letterSpacing: "0.05em" }}>04/ CONFIRMED_QSOs</span>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#06b6d4", marginTop: "0.25rem" }}>{stats.confirmed}</div>
        </div>
      </section>

      {/* Main Grid Layout */}
      <main className="deck-workspace">
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="terminal-panel">
            <div className="panel-header">
              <div className="panel-title">
                <Cpu style={{ width: "16px", height: "16px" }} /> HARDWARE.LOG
              </div>
              <ChevronRight style={{ width: "14px", height: "14px", color: "#525252" }} />
            </div>
            <div className="data-row">
              <span className="data-label"><Compass style={{ width: "14px", height: "14px" }} /> STATION QTH</span>
              <span className="data-value">OTTAWA, KS</span>
            </div>
            <div className="data-row">
              <span className="data-label"><Signal style={{ width: "14px", height: "14px" }} /> MAIN RIG</span>
              <span className="data-value">YAESU FT-991</span>
            </div>
            <div className="data-row">
              <span className="data-label"><Radio style={{ width: "14px", height: "14px" }} /> ANTENNA</span>
              <span className="data-value">ISOTRON 20M</span>
            </div>
            <div className="data-row" style={{ borderBottom: "none" }}>
              <span className="data-label"><Laptop style={{ width: "14px", height: "14px" }} /> ARCH SUITE</span>
              <span className="data-value">XUBUNTU/HAM</span>
            </div>
          </div>

          <div className="terminal-panel">
            <div className="panel-header">
              <div className="panel-title">
                <Sliders style={{ width: "16px", height: "16px" }} /> ENGINE.STAT
              </div>
            </div>
            <div className="data-row">
              <span className="data-label">CAT_INTERFACE</span>
              <span className="data-value txt-neon-green">LINKED</span>
            </div>
            <div className="data-row">
              <span className="data-label">DXCC_ENTITIES</span>
              <span className="data-value txt-aviation-blue">{stats.dxcc}</span>
            </div>
            <div className="data-row">
              <span className="data-label">VSWR_RATIO</span>
              <span className="data-value txt-neon-green">1.2:1</span>
            </div>
            <div className="data-row" style={{ borderBottom: "none" }}>
              <span className="data-label">DATASET_SYNC</span>
              <span className="data-value txt-aviation-blue">{isLiveStream ? "LIVE_FEED" : "STANDBY"}</span>
            </div>
          </div>
        </div>

        {/* Right Logbook Monitor Column */}
        <div className="terminal-panel" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div className="panel-header">
              <div className="panel-title">
                <History style={{ width: "16px", height: "16px" }} /> LOGBOOK_CHRONO_STREAM [15_MAX]
              </div>
              <span style={{ fontSize: "0.7rem", color: "#f59e0b", fontWeight: 600, letterSpacing: "0.02em" }}>ANTI_CHRONO_INDEX_ACTIVE</span>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table className="matrix-table">
                <thead>
                  <tr>
                    <th>CALLSIGN</th>
                    <th>DATE (UTC)</th>
                    <th>TIME</th>
                    <th>BAND</th>
                    <th>MODE</th>
                    <th style={{ textAlign: "center" }}>RST (S/R)</th>
                    <th>GRID LOC</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: "4rem", textAlign: "center", color: "#f59e0b", fontStyle: "italic" }}>
                        &gt;&gt; Live log stream parsing pending... Standby for secure JSON server handshake.
                      </td>
                    </tr>
                  ) : (
                    logs.map((qso, index) => (
                      <tr key={index}>
                        <td style={{ fontWeight: "700", color: "#ffffff", fontSize: "0.95rem" }} className="font-mono-data">
                          {qso.callsign}
                        </td>
                        <td style={{ color: "#a3a3a3" }}>{qso.date}</td>
                        <td style={{ fontWeight: "500" }}>{qso.time}</td>
                        <td style={{ fontWeight: "500" }}>{qso.band}</td>
                        <td>
                          <span className="badge-mode-tactical">{qso.mode}</span>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <span className="rst-s-box">{qso.rstS}</span>
                          <span style={{ color: "#404040", margin: "0 0.4rem" }}>|</span>
                          <span className="rst-r-box">{qso.rstR}</span>
                        </td>
                        <td style={{ color: "#a3a3a3", fontWeight: "500" }} className="font-mono-data">
                          {qso.grid || "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <footer style={{ marginTop: "2rem", paddingTop: "0.75rem", borderTop: "1px dashed #262626", display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "#737373", fontWeight: 500 }}>
            <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Globe style={{ width: "14px", height: "14px", color: "#525252" }} /> 
              STREAM_FILTER: JSON_PROXY_NODE // DIRECT_TIMESTAMP_MAP
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <ShieldCheck style={{ width: "14px", height: "14px", color: "#10b981" }} /> STATUS: OPERATIONAL_SECURE
            </span>
          </footer>
        </div>
      </main>
    </div>
  )
}
