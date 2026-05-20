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

export default function Page() {
  const [qsoLogs, setQsoLogs] = useState<QSO[]>([])
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState({
    totalQsos: "4,254",
    currentBand: "20 Meters",
    currentMode: "FT8"
  })

  useEffect(() => {
    async function fetchLiveQrzData() {
      try {
        // Fetch securely from our internal backend proxy route
        const response = await fetch("/api/qrz")
        if (!response.ok) throw new Error("Backend route returned an error status.")
        
        const textData = await response.text()
        if (textData.includes("RESULT=FAIL")) {
          console.warn("QRZ API returned failure block. Checking key authentication parameters.")
          setLoading(false)
          return
        }

        const parsedLogs: QSO[] = []
        const records = textData.split(/<eor>/i)

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

          parsedLogs.push({
            callsign: callsign.toUpperCase(),
            date: formattedDate,
            time: formattedTime,
            band: extractTagValue("band") || "—",
            mode: extractTagValue("mode") || "—",
            rstS: extractTagValue("rst_sent") || "59",
            rstR: extractTagValue("rst_rcvd") || "59",
            grid: extractTagValue("gridsquare") || "—"
          })
        }

        // Anti-chronological sort execution block
        const sortedLogs = parsedLogs.sort((a, b) => {
          const dateTimeA = `${a.date.replace(/-/g, '')}T${a.time.replace(/:/g, '')}`
          const dateTimeB = `${b.date.replace(/-/g, '')}T${b.time.replace(/:/g, '')}`
          return dateTimeB.localeCompare(dateTimeA)
        })

        if (sortedLogs.length > 0) {
          setQsoLogs(sortedLogs)
          setMetrics({
            totalQsos: `${4254 + sortedLogs.length}`, 
            currentBand: sortedLogs[0].band ? `${sortedLogs[0].band} Meters` : "20 Meters",
            currentMode: sortedLogs[0].mode || "FT8"
          })
        }
      } catch (err) {
        console.error("Failed to parse backend data streaming packets:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchLiveQrzData()
  }, [])

  return (
    <div style={{
      backgroundColor: "#000000",
      color: "#a3a3a3",
      minHeight: "100vh",
      padding: "1rem",
      fontFamily: "'Courier New', Courier, monospace, system-ui",
      boxSizing: "border-box",
      letterSpacing: "0.02em"
    }}>
      <style dangerouslySetInnerHTML={{__html: `
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .telemetry-strip { display: grid; grid-template-columns: repeat(1, 1fr); gap: 0.5rem; margin-bottom: 1rem; }
        @media (min-width: 640px) { .telemetry-strip { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 1024px) { .telemetry-strip { grid-template-columns: repeat(4, 1fr); } }
        .deck-workspace { display: grid; grid-template-columns: 1fr; gap: 1rem; }
        @media (min-width: 1024px) { .deck-workspace { grid-template-columns: 300px 1fr; } }
        .terminal-panel { background: #050505; border: 1px solid #262626; border-radius: 4px; padding: 1rem; position: relative; }
        .panel-header { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #262626; padding-bottom: 0.5rem; margin-bottom: 0.75rem; }
        .panel-title { font-size: 0.75rem; font-weight: bold; text-transform: uppercase; color: #d97706; letter-spacing: 0.1em; display: flex; align-items: center; gap: 0.5rem; }
        .data-row { display: flex; justify-content: space-between; align-items: center; padding: 0.35rem 0; border-bottom: 1px dashed #171717; font-size: 0.75rem; }
        .data-label { color: #737373; text-transform: uppercase; display: flex; align-items: center; gap: 0.35rem; }
        .data-value { color: #e5e5e5; font-weight: bold; }
        .matrix-table { width: 100%; border-collapse: collapse; font-size: 0.75rem; text-align: left; }
        .matrix-table th { background: #0a0a0a; border: 1px solid #262626; padding: 0.5rem; color: #737373; text-transform: uppercase; font-size: 0.7rem; letter-spacing: 0.05em; }
        .matrix-table td { padding: 0.5rem; border: 1px solid #171717; color: #e5e5e5; }
        .matrix-table tr:hover { background: #0f0f0f; }
        .txt-neon-green { color: #22c55e; text-shadow: 0 0 4px rgba(34,197,94,0.3); }
        .txt-aviation-blue { color: #06b6d4; text-shadow: 0 0 4px rgba(6,182,212,0.3); }
        .status-bracket { font-size: 0.7rem; color: #404040; font-weight: bold; }
        .status-text { color: #22c55e; font-weight: bold; padding: 0 0.25rem; }
        .badge-mode-tactical { border: 1px solid #d97706; color: #d97706; font-size: 10px; font-weight: bold; padding: 0.05rem 0.35rem; border-radius: 2px; background: rgba(217,119,6,0.05); }
        .rst-s-box { color: #22c55e; font-weight: bold; }
        .rst-r-box { color: #06b6d4; font-weight: bold; }
      `}} />

      {/* Masthead Banner */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #262626", paddingBottom: "0.75rem", marginBottom: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#d97706", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Radio style={{ width: "18px", height: "18px" }} /> SYSTEM:AF0DB//MONITOR_CORE
          </h1>
          <p style={{ fontSize: "0.65rem", color: "#525252", marginTop: "0.15rem", textTransform: "uppercase" }}>
            Matrix Terminal Connection Engine Status // Online
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <span className="status-bracket">[<span className="status-text">{loading ? "SYNCING" : "SYS_OK"}</span>]</span>
          <span className="status-bracket">[<span className="status-text" style={{ color: "#d97706" }}>20M_PRIORITY</span>]</span>
        </div>
      </header>

      {/* Cyber-Deck Telemetry Grid */}
      <section className="telemetry-strip">
        <div className="terminal-panel" style={{ padding: "0.75rem 1rem" }}>
          <span style={{ fontSize: "0.65rem", color: "#525252", textTransform: "uppercase", display: "block" }}>01/ ACTIVE_BAND</span>
          <div style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#ffffff", marginTop: "0.15rem" }}>{metrics.currentBand}</div>
        </div>
        <div className="terminal-panel" style={{ padding: "0.75rem 1rem" }}>
          <span style={{ fontSize: "0.65rem", color: "#525252", textTransform: "uppercase", display: "block" }}>02/ RIG_MODE</span>
          <div style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#d97706", marginTop: "0.15rem" }}>{metrics.currentMode}</div>
        </div>
        <div className="terminal-panel" style={{ padding: "0.75rem 1rem" }}>
          <span style={{ fontSize: "0.65rem", color: "#525252", textTransform: "uppercase", display: "block" }}>03/ TOTAL_QSO_COUNT</span>
          <div style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#22c55e", marginTop: "0.15rem" }}>{metrics.totalQsos}</div>
        </div>
        <div className="terminal-panel" style={{ padding: "0.75rem 1rem" }}>
          <span style={{ fontSize: "0.65rem", color: "#525252", textTransform: "uppercase", display: "block" }}>04/ STATION_GRID</span>
          <div style={{ fontSize: "1.25rem", fontWeight: "bold", color: "#06b6d4", marginTop: "0.15rem" }}>EM28in // KS</div>
        </div>
      </section>

      {/* Main Workspace Console */}
      <main className="deck-workspace">
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="terminal-panel">
            <div className="panel-header">
              <div className="panel-title">
                <Cpu style={{ width: "14px", height: "14px" }} /> HARDWARE.LOG
              </div>
              <ChevronRight style={{ width: "12px", height: "12px", color: "#404040" }} />
            </div>
            <div className="data-row">
              <span className="data-label"><Compass style={{ width: "12px", height: "12px" }} /> STATION QTH</span>
              <span className="data-value">OTTAWA, KS</span>
            </div>
            <div className="data-row">
              <span className="data-label"><Signal style={{ width: "12px", height: "12px" }} /> MAIN RIG</span>
              <span className="data-value">YAESU FT-991</span>
            </div>
            <div className="data-row">
              <span className="data-label"><Radio style={{ width: "12px", height: "12px" }} /> ANTENNA</span>
              <span className="data-value">ISOTRON 20M</span>
            </div>
            <div className="data-row" style={{ borderBottom: "none" }}>
              <span className="data-label"><Laptop style={{ width: "12px", height: "12px" }} /> ARCH SUITE</span>
              <span className="data-value">XUBUNTU/HAM</span>
            </div>
          </div>

          <div className="terminal-panel">
            <div className="panel-header">
              <div className="panel-title">
                <Sliders style={{ width: "14px", height: "14px" }} /> ENGINE.STAT
              </div>
            </div>
            <div className="data-row">
              <span className="data-label">CAT_INTERFACE</span>
              <span className="data-value txt-neon-green">LINKED</span>
            </div>
            <div className="data-row">
              <span className="data-label">RF_POWER_OUT</span>
              <span className="data-value">100W PEP</span>
            </div>
            <div className="data-row">
              <span className="data-label">VSWR_RATIO</span>
              <span className="data-value txt-neon-green">1.2:1</span>
            </div>
            <div className="data-row" style={{ borderBottom: "none" }}>
              <span className="data-label">DATASET_SYNC</span>
              <span className="data-value txt-aviation-blue">SECURE</span>
            </div>
          </div>
        </div>

        {/* Right Module: Logbook Data Stream */}
        <div className="terminal-panel" style={{ display: "flex", flexDirection: "column", justifyRules: "space-between" }}>
          <div>
            <div className="panel-header">
              <div className="panel-title">
                <History style={{ width: "14px", height: "14px" }} /> LOGBOOK_CHRONO_STREAM [50_MAX]
              </div>
              <span style={{ fontSize: "0.60rem", color: "#d97706", fontWeight: "bold" }}>ANTI_CHRONO_INDEX_ACTIVE</span>
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
                  {loading ? (
                    <tr>
                      <td colSpan={7} style={{ padding: "4rem", textAlign: "center", color: "#d97706", fontStyle: "italic" }}>
                        &gt;&gt; Querying internal server gateway for secure ADIF packets...
                      </td>
                    </tr>
                  ) : qsoLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: "4rem", textAlign: "center", color: "#ef4444", fontStyle: "italic" }}>
                        &gt;&gt; Connection Standby. Real-time logging data stream blank.
                      </td>
                    </tr>
                  ) : (
                    qsoLogs.map((qso, index) => (
                      <tr key={index}>
                        <td style={{ fontWeight: "bold", color: "#ffffff", fontSize: "0.8rem" }}>&gt; {qso.callsign}</td>
                        <td>{qso.date}</td>
                        <td>{qso.time}</td>
                        <td>{qso.band}</td>
                        <td>
                          <span className="badge-mode-tactical">{qso.mode}</span>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <span className="matrix-table rst-s-box">{qso.rstS}</span>
                          <span style={{ color: "#262626", margin: "0 0.25rem" }}>|</span>
                          <span className="matrix-table rst-r-box">{qso.rstR}</span>
                        </td>
                        <td style={{ color: "#737373" }}>{qso.grid}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <footer style={{ marginTop: "1.5rem", paddingTop: "0.75rem", borderTop: "1px dashed #262626", display: "flex", justifyContent: "space-between", fontSize: "0.65rem", color: "#525252" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <Globe style={{ width: "12px", height: "12px", color: "#404040" }} /> 
              STREAM_FILTER: SERVER_NODE_PROXY // SYSTEM_TIMESTAMP_MAP
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <ShieldCheck style={{ width: "12px", height: "12px", color: "#22c55e" }} /> BUILD_VERIFIED: 1.6.0
            </span>
          </footer>
        </div>
      </main>
    </div>
  )
}
