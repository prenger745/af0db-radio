"use client";
import React, { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { Radio, Laptop, Compass, History, Signal, Globe, Cpu, Sliders, ChevronRight, Sun, ShieldCheck, Volume2, VolumeX } from "lucide-react";

// NEXT 14 WEBGL DYNAMIC LAYOUT ENGINE: Runs the 3D canvas entirely on the client side to bypass server compilation locks
const GlobeEngine = dynamic(() => import("react-globe.gl").then((mod) => mod.default), {
  ssr: false,
  loading: () => (
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#a3a3a3", fontSize: "0.75rem", fontFamily: "monospace" }}>
      &gt;&gt; STAGING_WEBGL_GRID_ARRAY...
    </div>
  )
});

interface QSO {
  callsign: string;
  date: string;
  time: string;
  band: string;
  mode: string;
  rstS: string;
  rstR: string;
  grid: string;
}

interface StationMetrics {
  totalQsos: string;
  confirmed: string;
  dxcc: string;
  currentBand: string;
  currentMode: string;
}

export default function Page() {
  const [logs, setLogs] = useState<QSO[]>([]);
  const [stats, setStats] = useState<StationMetrics>({
    totalQsos: "1,075",
    confirmed: "850",
    dxcc: "74",
    currentBand: "20 Meters",
    currentMode: "FT8"
  });

  const [sfi, setSfi] = useState<number>(145);
  const [sunspots, setSunspots] = useState<string>("98");
  const [aIndex, setAIndex] = useState<string>("10");
  const [kIndex, setKIndex] = useState<number>(1);
  const [xray, setXray] = useState<string>("A0.0");
  const [conditions, setConditions] = useState<string>("NORMAL / QUIET");

  const [loading, setLoading] = useState(true);
  const [isLiveStream, setIsLiveStream] = useState(false);
  const [isNight, setIsNight] = useState<boolean>(false);
  
  // Dynamic coordinate arc tracking array for full dataset mapping
  const [geoArcs, setGeoArcs] = useState<any[]>([]);
  
  // Explicit parent element dimensions tracker for WebGL canvas alignment
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 500 });

  const [audioEnabled, setAudioEnabled] = useState<boolean>(false);
  const audioEnabledRef = useRef(false);

  useEffect(() => {
    audioEnabledRef.current = audioEnabled;
  }, [audioEnabled]);

  // Handle runtime responsive resizing to completely prevent globe clipping glitches
  useEffect(() => {
    if (!containerRef.current) return;
    
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    
    const t = setTimeout(handleResize, 1000);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(t);
    };
  }, [logs]);

  const playTerminalBeep = (type: "boot" | "sync") => {
    if (!audioEnabledRef.current) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      if (type === "boot") {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc1.type = "sine";
        osc2.type = "sine";
        osc1.frequency.setValueAtTime(880, ctx.currentTime);
        osc1.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15);
        osc2.frequency.setValueAtTime(440, ctx.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.15);
        gainNode.gain.setValueAtTime(0.04, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 0.2);
        osc2.stop(ctx.currentTime + 0.2);
      } else if (type === "sync") {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(1500, ctx.currentTime);
        osc.frequency.setValueAtTime(700, ctx.currentTime + 0.01);
        gainNode.gain.setValueAtTime(0.02, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.02);
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.02);
      }
    } catch (e) {}
  };

  const handleToggleAudioSystem = () => {
    const freshState = !audioEnabled;
    setAudioEnabled(freshState);
    if (freshState) {
      setTimeout(() => {
        try {
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          if (!AudioContext) return;
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(1000, ctx.currentTime);
          gainNode.gain.setValueAtTime(0.03, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);
          osc.connect(gainNode);
          gainNode.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.1);
        } catch(e) {}
      }, 50);
    }
  };

  useEffect(() => {
    let baseBootTriggered = false;

    async function parseLiveQrzData() {
      try {
        const res = await fetch("/api/qrz");
        if (!res.ok) throw new Error("Proxy offline");
        const json = await res.json();
        if (json.error || !json.data) throw new Error("No data");

        const cleanText = json.data.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

        const countMatch = cleanText.match(/COUNT=([^&]*)/i);
        const dxccMatch = cleanText.match(/DXCC_COUNT=([^&]*)/i);
        const qslMatch = cleanText.match(/CQSL=([^&]*)/i);

        const liveCount = countMatch ? countMatch[1].split('&')[0] : "1,075";
        const liveDxcc = dxccMatch ? dxccMatch[1].split('&')[0] : "74";
        const liveConfirmed = qslMatch ? qslMatch[1].split('&')[0] : "850";

        const currentHour = new Date().getUTCHours();
        setIsNight(currentHour < 11 || currentHour > 23);

        const sfiM = cleanText.match(/<solarflux>([^<]*)/i);
        const sspotsM = cleanText.match(/<sunspots>([^<]*)/i);
        const aM = cleanText.match(/<aindex>([^<]*)/i);
        const kM = cleanText.match(/<kindex>([^<]*)/i);
        const xrayM = cleanText.match(/<xray>([^<]*)/i);
        const condM = cleanText.match(/<geomagfield>([^<]*)/i);

        if (sfiM) setSfi(parseInt(sfiM[1].trim()) || 145);
        if (sspotsM) setSunspots(sspotsM[1].trim() || "98");
        if (aM) setAIndex(aM[1].trim() || "10");
        if (kM) setKIndex(parseInt(kM[1].trim()) || 1);
        if (xrayM) setXray(xrayM[1].trim() || "A0.0");
        if (condM) setConditions(condM[1].trim().toUpperCase() || "NORMAL / QUIET");

        let adifContent = cleanText.includes("ADIF=") ? cleanText.split(/ADIF=/i)[1] : cleanText;
        const parsedLogs: QSO[] = [];
        const records = adifContent.split(/<eor>/i);

        for (const record of records) {
          if (!record.trim()) continue;
          const extractTag = (tag: string) => {
            const m = record.match(new RegExp(`<${tag}:\\d+>([^<]*)`, "i"));
            return m ? m[1].trim() : "";
          };

          const call = extractTag("call");
          if (!call) continue;

          const rD = extractTag("qso_date");
          const fD = rD.length === 8 ? `${rD.substring(0, 4)}-${rD.substring(4, 6)}-${rD.substring(6, 8)}` : rD;
          const rT = extractTag("time_on");
          const fT = rT.length >= 4 ? `${rT.substring(0, 2)}:${rT.substring(2, 4)}` : rT;

          parsedLogs.push({
            callsign: call.toUpperCase().replace(/0/g, "Ø"),
            date: fD,
            time: fT,
            band: extractTag("band") || "—",
            mode: extractTag("mode") || "—",
            rstS: extractTag("rst_sent") || "59",
            rstR: extractTag("rst_rcvd") || "59",
            grid: extractTag("gridsquare") || "—"
          });
        }

        const sortedLogs = parsedLogs.sort((a, b) => {
          const dA = `${a.date.replace(/-/g, '')}T${a.time.replace(/:/g, '')}`;
          const dB = `${b.date.replace(/-/g, '')}T${b.time.replace(/:/g, '')}`;
          return dB.localeCompare(dA);
        });

        if (sortedLogs.length > 0) {
          const newestFifteen = sortedLogs.slice(0, 15);
          setLogs(newestFifteen);
          setIsLiveStream(true);

          const rawBand = newestFifteen[0].band ? newestFifteen[0].band : "20M";
          const displayBand = rawBand.toUpperCase().endsWith("M") 
            ? `${rawBand.substring(0, rawBand.length - 1)} Meters` 
            : `${rawBand} Meters`;

          setStats({
            totalQsos: liveCount,
            confirmed: liveConfirmed,
            dxcc: liveDxcc,
            currentBand: displayBand,
            currentMode: newestFifteen[0].mode || "FT8"
          });

          // Deduplication system aggregates overlapping grid squares into single clear pathways
          if (json.geoMap && Array.isArray(json.geoMap)) {
            const gridCounters: { [key: string]: number } = {};
            const uniqueGridMap: { [key: string]: any } = {};

            // Pass 1: Tally contacts and track unique grids
            json.geoMap.forEach((pt: any) => {
              if (!pt.grid) return;
              const cleanGrid4 = pt.grid.substring(0, 4).toUpperCase();
              gridCounters[cleanGrid4] = (gridCounters[cleanGrid4] || 0) + 1;
              
              if (!uniqueGridMap[cleanGrid4]) {
                uniqueGridMap[cleanGrid4] = pt;
              }
            });

            // Pass 2: Map unique fields to cleanly filtered visual geometric trajectories
            const filteredArcs = Object.keys(uniqueGridMap).map((gridKey) => {
              const pt = uniqueGridMap[gridKey];
              const callUpper = pt.callsign.toUpperCase();
              const contactCountForGrid = gridCounters[gridKey];

              const isUSAPrefix = callUpper.startsWith("W") || 
                                  callUpper.startsWith("K") || 
                                  callUpper.startsWith("N") || 
                                  callUpper.startsWith("AA") || 
                                  callUpper.startsWith("AB") || 
                                  callUpper.startsWith("AC") || 
                                  callUpper.startsWith("AD");
              
              const isUSACoordinate = pt.lat >= 24.396305 && pt.lat <= 49.384358 && 
                                      pt.lng >= -125.000000 && pt.lng <= -66.934570;

              // UPDATED: Replaced Cyber Pink with a clean Tactical Solar Amber value for overseas DX tracking
              const assignedTargetColor = (isUSAPrefix || isUSACoordinate) ? "#00f2ff" : "#ff9100";
              
              return {
                startLat: 38.6158, // QTH Base: Ottawa, KS
                startLng: -95.2686,
                endLat: pt.lat,
                endLng: pt.lng,
                color: assignedTargetColor,
                label: `Sector: ${gridKey} (${contactCountForGrid} Contacts Mapped)`
              };
            });
            
            setGeoArcs(filteredArcs);
          }

          if (!baseBootTriggered) {
            playTerminalBeep("boot");
            baseBootTriggered = true;
          } else {
            playTerminalBeep("sync");
          }
        }
      } catch (err) {
        console.warn(err);
      } finally {
        setLoading(false);
      }
    }

    parseLiveQrzData();
    const automatedRefreshCycle = setInterval(parseLiveQrzData, 300000);
    return () => clearInterval(automatedRefreshCycle);
  }, []);

  const getPropRating = (band: string) => {
    if (kIndex >= 5) return "CLOSED";
    if (kIndex >= 4) return "POOR";
    switch (band) {
      case "80M":
      case "40M":
        if (!isNight) return "CLOSED";
        return sfi > 120 ? "GREAT" : sfi > 90 ? "GOOD" : "FAIR";
      case "30M":
      case "20M":
        if (sfi > 140) return "GREAT";
        if (sfi > 90) return "GOOD";
        return "FAIR";
      case "17M":
      case "15M":
        if (isNight) return "CLOSED";
        if (sfi > 150) return "GREAT";
        if (sfi > 110) return "GOOD";
        return "POOR";
      case "12M":
      case "10M":
        if (isNight) return "CLOSED";
        if (sfi > 175) return "GREAT";
        if (sfi > 155) return "GOOD";
        if (sfi > 125) return "FAIR";
        return "POOR";
      default:
        return "FAIR";
    }
  };

  const getColorClass = (rating: string) => {
    if (rating === "GREAT" || rating === "GOOD") return "txt-neon-green";
    if (rating === "FAIR") return "txt-solar-amber";
    return "rst-r-box";
  };

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
        .telemetry-strip { 
          display: grid; 
          grid-template-columns: repeat(1, 1fr); 
          gap: 1rem; 
          margin-bottom: 1rem; 
        }
        @media (min-width: 640px) { .telemetry-strip { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 1024px) { .telemetry-strip { grid-template-columns: repeat(5, 1fr); } }

        .deck-workspace { display: grid; grid-template-columns: 1fr; gap: 1.5rem; }
        @media (min-width: 1024px) { .deck-workspace { grid-template-columns: 340px 1fr; } }

        .terminal-panel {
          background: #121212;
          border: 1px solid #262626;
          border-radius: 8px;
          padding: 1.25rem;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2);
          width: 100%;
          max-width: 100%;
        }

        .panel-header { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #262626; padding-bottom: 0.75rem; margin-bottom: 1rem; }
        .panel-title { font-size: 0.85rem; font-weight: 700; text-transform: uppercase; color: #f59e0b; letter-spacing: 0.05em; display: flex; align-items: center; gap: 0.5rem; }
        
        .data-row { display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0; border-bottom: 1px solid #1f1f1f; font-size: 0.85rem; background: transparent !important; }
        .data-label { color: #a3a3a3 !important; text-transform: uppercase; font-size: 0.75rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; }
        .data-value { font-weight: 600; text-align: right; }
        
        .forced-row-reset { background: transparent !important; padding-left: 0 !important; padding-right: 0 !important; border-radius: 0 !important; }
        .forced-label-reset { color: #a3a3a3 !important; font-weight: 600 !important; }

        .matrix-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; text-align: left; }
        .matrix-table th { background: #171717; border-bottom: 2px solid #262626; padding: 0.75rem 1rem; color: #a3a3a3; text-transform: uppercase; font-size: 0.75rem; font-weight: 600; }
        .matrix-table td { padding: 0.75rem 1rem; border-bottom: 1px solid #1f1f1f; color: #d4d4d4; }
        .matrix-table tr:nth-child(even) { background: #161616; }
        .matrix-table tr:hover { background: #1f1f1f; }

        .txt-neon-green { color: #10b981; }
        .txt-solar-amber { color: #f59e0b; }
        .txt-aviation-blue { color: #06b6d4; }
        .status-bracket { font-size: 0.75rem; color: #525252; font-weight: 600; }
        .status-text { color: #10b981; font-weight: 700; }
        .badge-mode-tactical { border: 1px solid #f59e0b; color: #f59e0b; font-size: 11px; font-weight: 700; padding: 0.15rem 0.5rem; border-radius: 4px; background: rgba(245,158,11,0.08); }
        .rst-s-box { color: #10b981; font-weight: 600; font-family: monospace; }
        .rst-r-box { color: #ef4444; font-weight: 600; font-family: monospace; }
        .panel-mono-data { font-family: monospace; font-weight: 600; }
      `}} />

      {/* Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #262626", paddingBottom: "1rem", marginBottom: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.35rem", fontWeight: 700, color: "#f59e0b", display: "flex", alignItems: "center", gap: "0.6rem", letterSpacing: "-0.01em" }}>
            <Radio style={{ width: "20px", height: "20px" }} /> DANIEL McGURK // AFØDB STATION LOG
          </h1>
          <p style={{ fontSize: "0.7rem", color: "#737373", marginTop: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 500 }}>
            Real-Time QRZ API Live Data Stream
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <span className="status-bracket">[<span className="status-text">{loading ? "SYNCING" : "SYS_OK"}</span>]</span>
          <span className="status-bracket">[<span className="status-text" style={{ color: "#f59e0b" }}>{isLiveStream ? "LIVE_FEED" : "STANDBY"}</span>]</span>
        </div>
      </header>

      {/* Vibe Coded Tactical Core Status Banner */}
      <section style={{
        background: "rgba(244, 63, 94, 0.03)",
        border: "1px dashed rgba(244, 63, 94, 0.25)",
        borderRadius: "6px",
        padding: "0.5rem 0.75rem",
        marginBottom: "1.5rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: "0.7rem",
        fontFamily: "monospace",
        fontWeight: 600,
        letterSpacing: "0.05em",
        color: "#a3a3a3"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ color: "#f43f5e", display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#f43f5e", display: "inline-block" }}></span>
            AI_PROMPT_ENGINE // VIBE_CODED_SYSTEM
          </span>
          <span style={{ color: "#404040" }}>|</span>
          <span>STACK_ALLOC: <span style={{ color: "#ffffff" }}>0x7FFEE3A2F1B0</span></span>
          <span style={{ color: "#404040" }} className="status-bracket">@</span>
          <span>COMPILING: <span style={{ color: "#10b981" }}>SUCCESS</span></span>
          <span style={{ color: "#404040" }}>|</span>
          
          <button 
            onClick={handleToggleAudioSystem}
            style={{
              background: "transparent",
              border: "none",
              color: audioEnabled ? "#10b981" : "#737373",
              cursor: "pointer",
              fontFamily: "monospace",
              fontSize: "0.7rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: 0,
              outline: "none"
            }}
          >
            {audioEnabled ? <Volume2 style={{ width: "12px", height: "12px" }} /> : <VolumeX style={{ width: "12px", height: "12px" }} />}
            {audioEnabled ? "[ AUDIO: ACTIVE ]" : "[ AUDIO: MUTED ]"}
          </button>
        </div>
        <div style={{ 
          border: "1px solid #f43f5e", 
          color: "#f43f5e", 
          fontSize: "9px", 
          padding: "0.05rem 0.4rem", 
          borderRadius: "3px", 
          background: "rgba(244, 63, 94, 0.08)",
          textTransform: "uppercase",
          fontWeight: 800
        }}>
          BUILT BY AI VIBES
        </div>
      </section>

      {/* Telemetry Strip */}
      <section className="telemetry-strip">
        <div className="terminal-panel" style={{ padding: "1rem 1.25rem" }}>
          <span style={{ fontSize: "0.9rem", color: "#e5e5e5", textTransform: "uppercase", display: "block", fontWeight: 700, letterSpacing: "0.03em" }}>ACTIVE BAND</span>
          <div style={{ fontSize: "1.65rem", fontWeight: 800, color: "#06b6d4", marginTop: "0.35rem" }}>{stats.currentBand}</div>
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
          <div style={{ fontSize: "1.65rem", fontWeight: 800, color: "#a855f7", marginTop: "0.35rem" }}>{stats.confirmed}</div>
        </div>

        <div className="terminal-panel" style={{ padding: "1rem 1.25rem" }}>
          <span style={{ fontSize: "0.9rem", color: "#e5e5e5", textTransform: "uppercase", display: "block", fontWeight: 700, letterSpacing: "0.03em" }}>COUNTRIES CONTACTED</span>
          <div style={{ fontSize: "1.65rem", fontWeight: 800, color: "#a3e635", marginTop: "0.35rem" }}>{stats.dxcc}</div>
        </div>
      </section>

      {/* Main Workspace Split Grid Layout */}
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
            <div className="data-row"><span className="data-label">STATION QTH</span><span className="data-value" style={{ color: "#ffffff" }}>OTTAWA, KS</span></div>
            <div className="data-row"><span className="data-label">MAIN RIG</span><span className="data-value" style={{ color: "#ffffff" }}>YAESU FT-991</span></div>
            <div className="data-row"><span className="data-label">ANTENNA</span><span className="data-value" style={{ color: "#ffffff" }}>ISOTRON 20M</span></div>
            <div className="data-row" style={{ borderBottom: "none" }}><span className="data-label">ARCH SUITE</span><span className="data-value" style={{ color: "#ffffff" }}>XUBUNTU/HAM</span></div>
          </div>

          {/* Card 2: Space & Solar Weather Data System */}
          <div className="terminal-panel">
            <div className="panel-header">
              <div className="panel-title" style={{ color: "#f59e0b" }}>
                <Sun style={{ width: "16px", height: "16px" }} /> SOLAR WEATHER (N0NBH)
              </div>
            </div>
            
            <div className="data-row">
              <span className="data-label">SOLAR FLUX (SFI)</span>
              <span className="data-value txt-solar-amber">{sfi}</span>
            </div>
            <div className="data-row">
              <span className="data-label">SUNSPOT NUMBER</span>
              <span className="data-value panel-mono-data" style={{ color: "#ffffff" }}>{sunspots}</span>
            </div>
            <div className="data-row">
              <span className="data-label">A INDEX</span>
              <span className="data-value panel-mono-data" style={{ color: "#a3a3a3" }}>{aIndex}</span>
            </div>
            <div className="data-row">
              <span className="data-label">K INDEX</span>
              <span className="data-value panel-mono-data txt-neon-green">{kIndex}</span>
            </div>
            <div className="data-row">
              <span className="data-label">XRAY FLUX</span>
              <span className="data-value txt-aviation-blue">{xray}</span>
            </div>
            <div className="data-row" style={{ marginBottom: "0.5rem" }}>
              <span className="data-label">GEOMAG FIELD</span>
              <span className="data-value txt-neon-green" style={{ fontSize: "0.75rem" }}>{conditions}</span>
            </div>

            <div style={{ color: "#f59e0b", fontSize: "0.7rem", fontWeight: "700", borderTop: "1px dashed #262626", paddingTop: "0.75rem", paddingBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              HF Band Real-Time Profiles
            </div>

            <div className="data-row">
              <span className="data-label">80M Band Propagation</span>
              <span className={`data-value ${getColorClass(getPropRating("80M"))}`}>[{getPropRating("80M")}]</span>
            </div>
            <div className="data-row">
              <span className="data-label">40M Band Propagation</span>
              <span className={`data-value ${getColorClass(getPropRating("40M"))}`}>[{getPropRating("40M")}]</span>
            </div>
            <div className="data-row">
              <span className="data-label">30M Band Propagation</span>
              <span className={`data-value ${getColorClass(getPropRating("30M"))}`}>[{getPropRating("30M")}]</span>
            </div>
            <div className="data-row forced-row-reset">
              <span className="data-label forced-label-reset">20M Band Propagation</span>
              <span className={`data-value ${getColorClass(getPropRating("20M"))}`}>[{getPropRating("20M")}]</span>
            </div>
            <div className="data-row">
              <span className="data-label">17M Band Propagation</span>
              <span className={`data-value ${getColorClass(getPropRating("17M"))}`}>[{getPropRating("17M")}]</span>
            </div>
            <div className="data-row">
              <span className="data-label">15M Band Propagation</span>
              <span className={`data-value ${getColorClass(getPropRating("15M"))}`}>[{getPropRating("15M")}]</span>
            </div>
            <div className="data-row">
              <span className="data-label">12M Band Propagation</span>
              <span className={`data-value ${getColorClass(getPropRating("12M"))}`}>[{getPropRating("12M")}]</span>
            </div>
            <div className="data-row" style={{ borderBottom: "none" }}>
              <span className="data-label">10M Band Propagation</span>
              <span className={`data-value ${getColorClass(getPropRating("10M"))}`}>[{getPropRating("10M")}]</span>
            </div>
          </div>

          {/* Card 3: Engine Statistics Metrics System */}
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

        {/* Right Section Matrix Column Stack */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          {/* HARDWARE-ACCELERATED 3D WEBGL GLOBE CANVAS CONTAINER */}
          <div 
            ref={containerRef}
            className="terminal-panel" 
            style={{ 
              padding: "0.5rem", 
              background: "#0b0b0b", 
              position: "relative", 
              height: "520px", 
              overflow: "hidden", 
              display: "flex", 
              flexDirection: "column" 
            }}
          >
            {/* Legend Overlay HUD */}
            <div style={{ position: "absolute", top: "1rem", left: "1.25rem", zIndex: 20, pointerEvents: "none" }}>
              <div className="panel-title" style={{ color: "#ffffff", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Globe style={{ width: "15px", height: "15px", color: "#06b6d4" }} /> AGGREGATED SECTOR GEOMETRY MAP
              </div>
              <div style={{ fontFamily: "monospace", fontSize: "10px", color: "#a3a3a3", marginTop: "0.25rem", display: "flex", gap: "1rem" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  <span style={{ width: "6px", height: "6px", backgroundColor: "#00f2ff", borderRadius: "50%", display: "inline-block" }}></span>
                  DOMESTIC (USA)
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  {/* UPDATED: Aligned legend background color metric badge to match new Solar Amber profile configuration */}
                  <span style={{ width: "6px", height: "6px", backgroundColor: "#ff9100", borderRadius: "50%", display: "inline-block" }}></span>
                  INTERNATIONAL (DX)
                </span>
              </div>
            </div>
            
            <div style={{ width: "100%", height: "100%", cursor: "grab" }}>
              <GlobeEngine
                width={dimensions.width}
                height={dimensions.height}
                globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
                bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
                backgroundImageUrl=""
                backgroundColor="#0b0b0b"
                arcsData={geoArcs}
                arcColor="color"
                arcDashLength={0.4}
                arcDashGap={0.15}
                arcDashAnimateTime={2500}
                arcStroke={0.5}
                arcsTransitionDuration={1000}
                
                // HIGH-PERFORMANCE NATIVE WEBGL LABELS LAYER: Empty text strings hide layout typography while compiling flat targeting pins directly inside core GPU threads
                labelsData={geoArcs.map(arc => ({ lat: arc.endLat, lng: arc.endLng, text: "", color: arc.color }))}
                labelText="text"
                labelColor="color"
                labelDotRadius={0.35}
                labelDotOrientation={() => "bottom"}
                labelsTransitionDuration={0}
              />
            </div>
          </div>

          {/* Complete Live Log Ledger */}
          <div className="terminal-panel" style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div className="panel-header">
              <div className="panel-title">
                <History style={{ width: "16px", height: "16px" }} /> LIVE LOOK AT MOST RECENT QSOs
              </div>
              <span style={{ fontSize: "0.7rem", color: "#f59e0b", fontWeight: 600, letterSpacing: "0.02em" }}>ANTI_CHRONO_INDEX_ACTIVE</span>
            </div>
            
            <div style={{ overflowX: "auto", marginTop: "0.5rem" }}>
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
                        <td style={{ fontWeight: "700", color: "#ffffff", fontSize: "0.95rem" }} className="panel-mono-data">
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
                        <td style={{ color: "#a3a3a3", fontWeight: "500" }} className="panel-mono-data">
                          {qso.grid || "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
