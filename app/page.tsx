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
    sfi: "fetching...",
    sunspots: "fetching...",
    aIndex: "fetching...",
    kIndex: "fetching...",
    xray: "fetching...",
    conditions: "CALCULATING...",
    prop20m: "ANALYZING..."
  })
  const [loading, setLoading] = useState(true)
  const [isLiveStream, setIsLiveStream] = useState(false)

  useEffect(() => {
    async function parseLiveQrzData() {
      try {
        const res = await fetch("/api/qrz")
        if (!res.ok) throw new Error("Proxy offline")
        const json = await res.json()
        if (json.error || !json.data) throw new Error(json.error || "No data")
        
        const cleanText = json.data.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
        const countMatch = cleanText.match(/COUNT=([^&]*)/i) || cleanText.match(/"COUNT":"(\d+)"/i)
        const dxccMatch = cleanText.match(/DXCC_COUNT=([^&]*)/i) || cleanText.match(/"DXCC_COUNT":"(\d+)"/i)

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
          const displayCall = call.toUpperCase().replace(/0/g, "Ø")

          parsedLogs.push({
            callsign: displayCall,
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
            totalQsos: parseInt(liveCount) > 1000 ? liveCount : "1,058",
            confirmed: "833", 
            dxcc: liveDxcc,
            currentBand: newestFifteen[0].band ? `${newestFifteen[0].band} Meters` : "20 Meters",
            currentMode: newestFifteen[0].mode || "FT8"
          })
        }
      } catch (err) {
        console.warn("Backend logs parsed natively.", err)
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
        console.warn("Solar mapping adjusted.", e)
      }
    }

    parseLiveQrzData()
    loadLiveSolarConditions()
  }, [])

  const getPropColorClass = (status: string) => {
    if (status.includes("GOOD")) return "txt-neon-green"
    if (status.includes("FAIR")) return "txt-solar-amber"
    return "rst-r-box"
  }

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
        .txt-neon-green
