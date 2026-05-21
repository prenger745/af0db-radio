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
  prop20m: string
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
    prop20m: "GOOD"
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

        let prop = "GOOD"
        const chunks = xmlText.split('name="30m-20m" time="day">')
        if (chunks.length > 1) prop = chunks[1].split("</band>")[0].trim().toUpperCase()

        setSpaceWeather({
          sfi: parseXml("solarflux") !== "—" ? parseXml("solarflux") : "145",
          sunspots: parseXml("sunspots") !== "—" ? parseXml("sunspots") : "98",
          aIndex: parseXml("aindex") !== "—" ? parseXml("aindex") : "10",
          kIndex: parseXml("kindex") !== "—" ? parseXml("kindex") : "1",
          xray: parseXml("xray") !== "—" ? parseXml("xray") : "A0.0",
          conditions: parseXml("geomagfield") !== "—" ? parseXml("geomagfield").toUpperCase() : "NORMAL / QUIET",
          prop20m: prop
        })
      } catch (e) {
        console.warn(e)
      }
    }

    parseLiveQrzData()
    loadLiveSolarConditions()
  }, [])

  return (
    <div style={{ backgroundColor: "#0a0a0a", color: "#e5e5e5", minHeight: "100vh", padding: "1.5rem", fontFamily: "monospace" }}>
      <header style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #262626", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.2rem", color: "#f59e0b", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Radio style={{ width: "18px" }} /> DANIEL McGURK // AFØDB STATION LOG
          </h1>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", color: "#10b981", fontSize: "0.8rem" }}>
          <span>[{loading ? "SYNCING" : "SYS_OK"}]</span>
          <span style={{ color: "#f59e0b" }}>[{isLiveStream ? "LIVE_FEED" : "STANDBY"}]</span>
        </div>
      </header>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ background: "#121212", border: "1px solid #262626", padding: "1rem", borderRadius: "6px" }}>
          <div style={{ color: "#737373", fontSize: "0.7rem" }}>01/ ACTIVE_BAND</div>
          <div style={{ fontSize: "1.4rem", fontWeight: "bold", marginTop: "0.25rem" }}>{stats.currentBand}</div>
        </div>
        <div style={{ background: "#121212", border: "1px solid #262626", padding: "1rem", borderRadius: "6px" }}>
          <div style={{ color: "#737373", fontSize: "0.7rem" }}>02/ RIG_MODE</div>
          <div style={{ fontSize: "1.4rem", fontWeight: "bold", color: "#f59e0b", marginTop: "0.25rem" }}>{stats.currentMode}</div>
        </div>
        <div style={{ background: "#121212", border: "1px solid #262626", padding: "1rem", borderRadius: "6px" }}>
          <div style={{ color: "#737373", fontSize: "0.7rem" }}>03/ TOTAL_QSO_COUNT</div>
          <div style={{ fontSize: "1.4rem", fontWeight: "bold", color: "#10b981", marginTop: "0.25rem" }}>{stats.totalQsos}</div>
        </div>
        <div style={{ background: "#121212", border: "1px solid #262626", padding: "1rem", borderRadius: "6px" }}>
          <div style={{ color: "#737373", fontSize: "0.7rem" }}>04/ CONFIRMED_QSOs</div>
          <div style={{ fontSize: "1.4rem", fontWeight: "bold", color: "#06b6d4", marginTop: "0.25rem" }}>{stats.confirmed}</div>
        </div>
      </section>

      <main style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          <div style={{ background: "#121212", border: "1px solid #262626", padding: "1.25rem", borderRadius: "8px" }}>
            <div style={{ color: "#f59e0b", fontSize: "0.8rem", borderBottom: "1px solid #262626", paddingBottom: "0.5rem", marginBottom: "0.75rem", fontWeight: "bold" }}>HAMSHACK GEAR</div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0", fontSize: "0.85rem" }}>
              <span style={{ color: "#a3a3a3" }}>STATION QTH</span><span>OTTAWA, KS</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0", fontSize: "0.85rem" }}>
              <span style={{ color: "#a3a3a3" }}>MAIN RIG</span><span>YAESU FT-991</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0", fontSize: "0.85rem" }}>
              <span style={{ color: "#a3a3a3" }}>ANTENNA</span><span>ISOTRON 20M</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0", fontSize: "0.85rem" }}>
              <span style={{ color: "#a3a3a3" }}>ARCH SUITE</span><span>XUBUNTU/HAM</span>
            </div>
          </div>

          <div style={{ background: "#121212", border: "1px solid #262626", padding: "1.25rem", borderRadius: "8px" }}>
            <div style={{ color: "#f59e0b", fontSize: "0.8rem", borderBottom: "1px solid #262626", paddingBottom: "0.5rem", marginBottom: "0.75rem", fontWeight: "bold" }}>SOLAR WEATHER (N0NBH)</div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", background: "rgba(245,158,11,0.02)", borderBottom: "1px solid #262626", fontSize: "0.85rem", fontWeight: "bold" }}>
              <span style={{ color: "#fff" }}>&gt;&gt; BAND_PROP_20M</span>
              <span style={{ color: spaceWeather.prop20m.includes("GOOD") ? "#10b981" : "#f59e0b" }}>[{spaceWeather.prop20m}]</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0", fontSize: "0.85rem" }}>
              <span style={{ color: "#a3a3a3" }}>SOLAR_FLUX (SFI)</span><span style={{ color: "#f59e0b" }}>{spaceWeather.sfi}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0", fontSize:
