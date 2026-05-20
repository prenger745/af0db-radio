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
  const [spaceWeather, setSpaceWeather] = useState<SpaceWeather>({
    sfi: "fetching...",
    sunspots: "fetching...",
    aIndex: "fetching...",
    kIndex: "fetching...",
    xray: "fetching...",
    conditions: "CALCULATING..."
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
          const dateTimeB = `${b.date.replace(/-/g, '')}T${b.time.replace(/:
