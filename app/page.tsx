"use client";

import React, { useEffect, useState } from "react"
import { Radio, Laptop, Compass, History, Signal, Globe, Cpu, Sliders, ChevronRight, Sun, ShieldCheck } from "lucide-react"

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

interface SpaceWeather {
  sfi: string
  sunspots: string
  aIndex: string
  kIndex: string
  xray: string
  conditions: string
  prop80m: string
  prop40m: string
  prop30m: string
  prop20m: string
  prop17m: string
  prop15m: string
  prop12m: string
  prop10m: string
}

export default function Page() {
  const [logs, setLogs] = useState<QSO[]>([])
  const [stats, setStats] = useState<StationMetrics>({
    totalQsos: "1,058",
    confirmed: "833",
    dxcc: "74",
    currentBand: "20 Meters",
    currentMode: "FT8"
  })
  const [spaceWeather, setSpaceWeather] = useState<SpaceWeather>({
    sfi: "145",
    sunspots: "98",
    aIndex: "10",
    kIndex: "1",
    xray: "A0.0",
    conditions: "NORMAL / QUIET",
    prop80m: "GOOD",
    prop40m: "GOOD",
    prop30m: "GOOD",
    prop20m: "GOOD",
    prop17m: "GOOD",
    prop15m: "GOOD",
    prop12m: "GOOD",
    prop10m: "GOOD"
  })
  const [loading, setLoading] = useState(true)
  const [isLiveStream, setIsLiveStream] = useState(false)

  useEffect(() => {
    async function parseLiveQrzData() {
      try {
        const res = await fetch("/api/qrz")
        if (!res.ok) throw new Error("Proxy offline")
        const json = await res.json()
        if (json.error || !json.data) throw new Error("No data")
        
        const cleanText = json.data.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
        const countMatch = cleanText.match(/COUNT=([^&]*)/i)
        const dxccMatch = cleanText.match(/DXCC_COUNT=([^&]*)/i)

        const liveCount = countMatch ? countMatch[1].split('&')[0] : "1,058"
        const liveDxcc = dxccMatch ? dxccMatch[1].split('&')[0] : "74"

        let adifContent = cleanText.includes("ADIF=") ? cleanText.split(/ADIF=/i)[1] : cleanText
        const parsedLogs: QSO[] = []
        const records = adifContent.split(/<eor>/i)

        for (const record of records) {
          if (!record.trim()) continue
          const extractTag = (tag: string) => {
            const m = record.match(new RegExp(`<${tag}:\\d+>([^<]*)`, "i"))
            return m ? m[1].trim() : ""
          }
          const call = extractTag("call")
          if (!call) continue

          const rD = extractTag("qso_date")
          const fD = rD.length === 8 ? `${rD.substring(0, 4)}-${rD.substring(4, 6)}-${rD.substring(6, 8)}` : rD
          const rT = extractTag("time_on")
          const fT = rT.length >= 4 ? `${rT.substring(0, 2)}:${rT.substring(2, 4)}` : rT

          parsedLogs.push({
            callsign: call.toUpperCase().replace(/0/g, "Ø"),
            date: fD,
            time: fT,
            band: extractTag("band") || "—",
            mode: extractTag("mode") || "—",
            rstS: extractTag("rst_sent") || "59",
            rstR: extractTag("rst_rcvd") || "59",
            grid: extractTag("gridsquare") || "—"
          })
        }

        const sortedLogs = parsedLogs.sort((a, b) => {
          const dA = `${a.date.replace(/-/g, '')}T${a.time.replace(/:/g, '')}`
          const dB = `${b.date.replace(/-/g, '')}T${b.time.replace(/:/g, '')}`
          return dB.localeCompare(dA)
        })

        if (sortedLogs.length > 0) {
          const newestFifteen = sortedLogs.slice(0, 15)
          setLogs(newestFifteen)
          setIsLiveStream(true)
          setStats({
            totalQsos: liveCount,
            confirmed: "833", 
            dxcc: liveDxcc,
            currentBand: newestFifteen[0].band ? `${newestFifteen[0].band} Meters` : "20 Meters",
            currentMode: newestFifteen[0].mode || "FT8"
          })
        }
      } catch (err) {
        console.warn(err)
      } finally {
        setLoading(false)
      }
    }

    async function loadLiveSolarConditions() {
      try {
        const proxyUrl = "https://api.allorigins.win/get?url=" + encodeURIComponent("https://www.hamqsl.com/solarxml.php")
        const response = await fetch(proxyUrl)
        const json = await response.json()
        const xmlText = json.contents

        const parseXml = (tag: string) => {
          const parts = xmlText.split(new RegExp(`<${tag}>`, "i"))
          return parts.length > 1 ? parts[1].split(new RegExp(`</${tag}>`, "i"))[0].trim() : "—"
        }

        const extractBand = (bandName: string) => {
          const chunks = xmlText.split(`name="${bandName}" time="day">`)
          return chunks.length > 1 ? chunks[1].split("</band>")[0].trim().toUpperCase() : "GOOD"
        }

        setSpaceWeather({
          sfi: parseXml("solarflux") !== "—" ? parseXml("solarflux") : "145",
          sunspots: parseXml("sunspots") !== "—" ? parseXml("sunspots") : "98",
          aIndex: parseXml("aindex") !== "—" ? parseXml("aindex") : "10",
          kIndex: parseXml("kindex") !== "—" ? parseXml("kindex") : "1",
          xray: parseXml("xray") !== "—" ? parseXml("xray") : "A0.0",
          conditions: parseXml("geomagfield") !== "—" ? parseXml("geomagfield").toUpperCase() : "NORMAL / QUIET",
          prop80m: extractBand("80m-40m"),
          prop40m: extractBand("80m-40m"),
          prop30m: extractBand("30m-20m"),
          prop20m: extractBand("30m-20m"),
          prop17m: extractBand("17m-15m"),
          prop15m: extractBand("17m-15m"),
          prop12m: extractBand("12m-10m"),
          prop10m: extractBand("12m-10m")
        })
      } catch (e) {
        console.warn(e)
      }
    }

    parseLiveQrzData()
    loadLiveSolarConditions()
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
        .terminal-panel { background: #121212; border: 1px solid #262626; border-radius: 8px; padding: 1.25rem; position: relative; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2); width: 100%; max-width: 100%; }
        .panel-header { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #262626; padding-bottom: 0.75rem; margin-bottom: 1rem; }
        .panel-title { font-size: 0.85rem; font-weight: 700; text-transform: uppercase; color: #f59e0b; letter-spacing: 0.05em; display: flex; align-items: center; gap: 0.5rem; }
        .data-row { display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0; border-bottom: 1px solid #1f1f1f; font-size: 0.85rem; width: 100%; }
        .data-label { color: #a3a3a3; text-transform: uppercase; display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; font-weight: 600; flex: 1; min-width: 0; }
        .data-value { font-weight: 600; flex-shrink: 0; text-align: right; margin-left: 0.5rem; }
        .matrix-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; text-align: left; }
        .matrix-table th { background: #171717; border-bottom: 2px solid #262626; padding: 0.75rem 1rem; color: #a3a3a3; text-transform: uppercase; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.03em; }
        .matrix-table td { padding: 0.75rem 1rem; border-bottom: 1px solid #1f1f1f; color: #d4d4d4; }
        .matrix-table tr:nth-child(even) { background: #161616; }
        .matrix-table tr:hover { background: #1f1f1f; }
        .txt-neon-green { color: #10b981; }
        .txt-solar-amber { color: #f59e0b; }
        .txt-aviation-blue { color: #06b6d4; }
        .status-bracket { font-size: 0.75rem; color: #525252; font-weight: 600; }
        .status-text { color: #10b981; font-weight: 700; padding: 0 0.25rem; }
        .badge-mode-tactical { border: 1px solid #f59e0b; color: #f59e0b; font-size: 11px; font-weight: 700; padding: 0.15rem 0.5rem; border-radius: 4px; background: rgba(245,158,11,0.08); letter-spacing: 0.02em; }
        .rst-s-box { color: #10b981; font-weight: 600; font-family: monospace; font-size: 0.9rem; }
        .rst-r-box { color: #06b6d4; font-weight: 600; font-family: monospace; font-size: 0.9rem; }
        .font-mono-data { font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-weight: 600; }
      `}} />

      {/* Header Banner */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #262626", paddingBottom: "1rem", margin: "0 0 1.5rem 0" }}>
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

      {/* Cyber-Deck Telemetry Top Strip */}
      <section className="telemetry-strip">
        <div className="terminal-panel" style={{ padding: "1rem 1.25rem" }}>
          <span style={{ fontSize: "0.9rem", color: "#e5e5e5", textTransform: "uppercase", display: "block", fontWeight: 700, letterSpacing: "0.03em" }}>ACTIVE BAND</span>
          <div style={{ fontSize: "1.65rem", fontWeight: 800, color: "#ffffff", marginTop: "0.35rem" }}>{stats.currentBand}</div>
        </div>
        <div className="terminal-panel" style={{ padding: "1rem 1.25rem" }}>
          <span style={{ fontSize: "0.9rem", color: "#e5e5e5", textTransform: "uppercase", display: "block", fontWeight: 700, letterSpacing: "0.03em" }}>RIG MODE</span>
          <div style={{ fontSize: "1.65rem", fontWeight: 800, color: "#f59e0b", marginTop: "0.35rem" }}>{stats.currentMode}</div>
        </div>
        <div className="terminal-panel" style={{ padding: "1rem 1.25rem" }}>
          <span style={{ fontSize: "0.9rem", color: "#e5e5e5", textTransform: "uppercase", display: "block", fontWeight: 700, letterSpacing: "0.03em" }}>TOTAL QSO COUNT</span>
          <div style={{ fontSize: "1.65rem", fontWeight: 800, color: "#10b981", marginTop: "0.35rem" }}>{stats.totalQsos}</div>
        </div>
        <div className="terminal-panel" style={{ padding: "1rem 1.25rem" }}>
          <span style={{ fontSize: "0.9rem", color: "#e5e5e5", textTransform: "uppercase", display: "block", fontWeight: 700, letterSpacing: "0.03em" }}>CONFIRMED QSOs</span>
          <div style={{ fontSize: "1.65rem", fontWeight: 800, color: "#06b6d4", marginTop: "0.35rem" }}>{stats.confirmed}</div>
        </div>
      </section>

      {/* 2-Column Split Dashboard Wrapper */}
      <main className="deck-workspace">
        
        {/* Left Column Stack */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          {/* Card 1: Shack Gear */}
          <div className="terminal-panel">
            <div className="panel-header">
              <div className="panel-title">
                <Cpu style={{ width: "16px", height: "16px" }} /> HAMSHACK GEAR
              </div>
              <ChevronRight style={{ width: "14px", height: "14px", color: "#525252" }} />
            </div>
            <div className="data-row">
              <span className="data-label"><Compass style={{ width: "14px", height: "14px" }} /> STATION QTH</span>
              <span className="data-value" style={{ color: "#ffffff" }}>OTTAWA, KS</span>
            </div>
            <div className="data-row">
              <span className="data-label"><Signal style={{ width: "14px", height: "14px" }} /> MAIN RIG</span>
              <span className="data-value" style={{ color: "#ffffff" }}>YAESU FT-991</span>
            </div>
            <div className="data-row">
              <span className="data-label"><Radio style={{ width: "14px", height: "14px" }} /> ANTENNA</span>
              <span className="data-value" style={{ color: "#ffffff" }}>ISOTRON 20M</span>
            </div>
            <div className="data-row" style={{ borderBottom: "none" }}>
              <span className="data-label"><Laptop style={{ width: "14px", height: "14px" }} /> ARCH SUITE</span>
              <span className="data-value" style={{ color: "#ffffff" }}>XUBUNTU/HAM</span>
            </div>
          </div>

          {/* Card 2: Solar Weather Box */}
          <div className="terminal-panel">
            <div className="panel-header">
              <div className="panel-title" style={{ color: "#f59e0b" }}>
                <Sun style={{ width: "16px", height: "16px" }} /> SOLAR WEATHER (N0NBH)
              </div>
            </div>
            
            {/* Core General Metrics Block */}
            <div className="data-row">
              <span className="data-label">SOLAR FLUX (SFI)</span>
              <span className="data-value txt-solar-amber">{spaceWeather.sfi}</span>
            </div>
            <div className="data-row">
              <span className="data-label">SUNSPOT NUMBER</span>
              <span className="data-value font-mono-data" style={{ color: "#ffffff" }}>{spaceWeather.sunspots}</span>
            </div>
            <div className="data-row">
              <span className="data-label">A INDEX</span>
              <span className="data-value font-mono-data" style={{ color: "#a3a3a3" }}>{spaceWeather.aIndex}</span>
            </div>
            <div className="data-row">
              <span className="data-label">K INDEX</span>
              <span className="data-value font-mono-data txt-neon-green">{spaceWeather.kIndex}</span>
            </div>
            <div className="data-row">
              <span className="data-label">XRAY FLUX</span>
              <span className="data-value txt-aviation-blue">{spaceWeather.xray}</span>
            </div>
            <div className="data-row" style={{ marginBottom
