"use client";
import React, { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { Radio, Laptop, Compass, History, Signal, Globe, Cpu, Sliders, ChevronRight, Sun, ShieldCheck, Volume2, VolumeX } from "lucide-react";

// NEXT 14 WEBGL DYNAMIC LAYOUT ENGINE: Runs the 3D canvas entirely on the client side to bypass server compilation locks
const GlobeEngine = dynamic(() => import("react-globe.gl").then((mod) => mod.default), {
  ssr: false,
  loading: () => (
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#00ff66", fontSize: "0.75rem", fontFamily: "monospace" }}>
      &gt;&gt; INITIALIZING CORE WEBGL GRAPHICS INTERFACE...
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
  country?: string;
  qslRcvd?: string;
  lotwRcvd?: string;
  eqslRcvd?: string;
  qrzRcvd?: string;
}

interface StationMetrics {
  totalQsos: string;
  confirmed: string;
  dxcc: string;
  currentBand: string;
  currentMode: string;
}

function useTypewriter(text: string, speed: number = 35, delay: number = 400) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let index = 0;
    let timer: NodeJS.Timeout;
    
    const startTimeout = setTimeout(() => {
      timer = setInterval(() => {
        if (index < text.length) {
          setDisplayedText(text.substring(0, index + 1));
          index++;
        } else {
          clearInterval(timer);
        }
      }, speed);
    }, delay);

    return () => {
      clearTimeout(startTimeout);
      clearInterval(timer);
    };
  }, [text, speed, delay]);

  return displayedText;
}

export default function Page() {
  const [logs, setLogs] = useState<QSO[]>([]);
  const [stats, setStats] = useState<StationMetrics>({
    totalQsos: "...",
    confirmed: "...",
    dxcc: "...",
    currentBand: "Searching...",
    currentMode: "Searching..."
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
  
  const [geoArcs, setGeoArcs] = useState<any[]>([]);
  const [landmasses, setLandmasses] = useState<any[]>([]);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 500 });
  const [isMobileScreen, setIsMobileScreen] = useState(false);

  const [audioEnabled, setAudioEnabled] = useState<boolean>(false);
  const audioEnabledRef = useRef(false);

  const [showTelemetry, setShowTelemetry] = useState(false);
  const [showWorkspace, setShowWorkspace] = useState(false);

  const initialBootDoneRef = useRef(false);

  const targetTitle = "DANIEL McGURK // AFØDB STATION LOG";
  const targetSubtitle = "Real-Time QRZ API Live Data Stream";

  const mainTitleText = useTypewriter(targetTitle, 35, 300);
  const subTitleText = useTypewriter(targetSubtitle, 20, 1400);

  useEffect(() => {
    audioEnabledRef.current = audioEnabled;
  }, [audioEnabled]);

  useEffect(() => {
    const telemetryTimeout = setTimeout(() => setShowTelemetry(true), 1800);
    const workspaceTimeout = setTimeout(() => setShowWorkspace(true), 2400);

    fetch("https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson")
      .then(res => res.json())
      .then(data => {
        if (data && data.features) {
          setLandmasses(data.features);
        }
      }).catch(() => {});

    return () => {
      clearTimeout(telemetryTimeout);
      clearTimeout(workspaceTimeout);
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const handleResize = () => {
      if (containerRef.current) {
        const mobileViewActive = window.innerWidth < 768;
        setIsMobileScreen(mobileViewActive);
        
        setDimensions({
          width: containerRef.current.clientWidth,
          height: mobileViewActive ? 340 : 520
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

  async function parseLiveQrzData() {
    try {
      const res = await fetch("/api/qrz");
      if (!res.ok) throw new Error("Proxy offline");
      const json = await res.json();
      if (json.error || !json.data) throw new Error("No data");

      const cleanText = json.data.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

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
      const allParsedLogs: QSO[] = [];
      const records = adifContent.split(/<eor>/i);

      let calculatedConfirmedTotal = 0;
      const uniqueCountriesList = new Set<string>();

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
        
        const countryString = extractTag("country");
        const qslStatus = extractTag("qsl_rcvd").toUpperCase();
        const lotwStatus = extractTag("lotw_qsl_rcvd").toUpperCase();
        const eqslStatus = extractTag("eqsl_qsl_rcvd").toUpperCase();
        const qrzStatus = extractTag("qrzcom_qsl_rcvd").toUpperCase();

        if (qslStatus === "Y" || lotwStatus === "Y" || eqslStatus === "Y" || qrzStatus === "Y") {
          calculatedConfirmedTotal++;
        }

        if (countryString) {
          uniqueCountriesList.add(countryString.toUpperCase());
        }

        allParsedLogs.push({
          callsign: call.toUpperCase().replace(/0/g, "Ø"),
          date: fD,
          time: fT,
          band: extractTag("band") || "—",
          mode: extractTag("mode") || "—",
          rstS: extractTag("rst_sent") || "59",
          rstR: extractTag("rst_rcvd") || "59",
          grid: extractTag("gridsquare") || "—",
          country: countryString,
          qslRcvd: qslStatus,
          lotwRcvd: lotwStatus,
          eqslRcvd: eqslStatus,
          qrzRcvd: qrzStatus
        });
      }

      const sortedLogs = allParsedLogs.sort((a, b) => {
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
          totalQsos: allParsedLogs.length.toString(),
          confirmed: calculatedConfirmedTotal.toString(),
          dxcc: uniqueCountriesList.size.toString(),
          currentBand: displayBand,
          currentMode: newestFifteen[0].mode || "FT8"
        });

        if (json.geoMap && Array.isArray(json.geoMap)) {
          const uniqueGridMap: { [key: string]: { base: any; callsigns: string[]; country: string } } = {};

          json.geoMap.forEach((pt: any) => {
            if (!pt.grid) return;
            const cleanGrid4 = pt.grid.substring(0, 4).toUpperCase();
            const stationCall = pt.callsign ? pt.callsign.toUpperCase().replace(/0/g, "Ø") : "UNKNOWN";
            
            let stationCountry = pt.country || "";
            if (!stationCountry) {
              stationCountry = (stationCall.startsWith("W") || stationCall.startsWith("K") || stationCall.startsWith("N") || stationCall.startsWith("AA")) 
                ? "United States" 
                : "International DX";
            }

            if (!uniqueGridMap[cleanGrid4]) {
              uniqueGridMap[cleanGrid4] = {
                base: pt,
                callsigns: [stationCall],
                country: stationCountry
              };
            } else {
              if (!uniqueGridMap[cleanGrid4].callsigns.includes(stationCall)) {
                uniqueGridMap[cleanGrid4].callsigns.push(stationCall);
              }
            }
          });

          const filteredArcs = Object.keys(uniqueGridMap).map((gridKey) => {
            const sectorData = uniqueGridMap[gridKey];
            const pt = sectorData.base;
            const callUpper = pt.callsign.toUpperCase();

            const isUSAPrefix = callUpper.startsWith("W") || 
                                callUpper.startsWith("K") || 
                                callUpper.startsWith("N") || 
                                callUpper.startsWith("AA") || 
                                callUpper.startsWith("AB") || 
                                callUpper.startsWith("AC") || 
                                callUpper.startsWith("AD");
            
            const isUSACoordinate = pt.lat >= 24.396305 && pt.lat <= 49.384358 && 
                                    pt.lng >= -125.000000 && pt.lng <= -66.934570;

            const assignedTargetColor = (isUSAPrefix || isUSACoordinate) ? "#00f2ff" : "#ff9100";
            const territoryType = (isUSAPrefix || isUSACoordinate) ? "DOMESTIC (USA)" : "INTERNATIONAL (DX)";
            
            const operatorsString = sectorData.callsigns.slice(0, 8).join(", ") + 
              (sectorData.callsigns.length > 8 ? ` (+${sectorData.callsigns.length - 8} more)` : "");

            return {
              startLat: 38.6158,
              startLng: -95.2686,
              endLat: pt.lat,
              endLng: pt.lng,
              color: assignedTargetColor,
              gridKey: gridKey,
              territory: territoryType,
              country: sectorData.country,
              operators: operatorsString,
              count: sectorData.callsigns.length
            };
          });
          
          setGeoArcs(filteredArcs);
        }

        if (!initialBootDoneRef.current) {
          playTerminalBeep("boot");
          initialBootDoneRef.current = true;
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

  useEffect(() => {
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
      backgroundColor: "#030403", 
      color: "#a3c2ae", 
      minHeight: "100vh",
      padding: isMobileScreen ? "0.75rem" : "1.5rem",
      fontFamily: "monospace", 
      boxSizing: "border-box",
      letterSpacing: "0.05em",
      position: "relative"
    }}>
      <style dangerouslySetInnerHTML={{__html: `
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        /* FIXED: Ripped out visual scanline background layers completely to unlock crystal-clear text readability */

        .telemetry-strip { 
          display: grid; 
          grid-template-columns: repeat(1, 1fr); 
          gap: 0.75rem; 
          margin-bottom: 1rem; 
          opacity: 0;
          transform: translateY(5px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .telemetry-strip.active { opacity: 1; transform: translateY(0); }
        @media (min-width: 640px) { .telemetry-strip { grid-template-columns: repeat(2, 1fr); gap: 1rem; } }
        @media (min-width: 1024px) { .telemetry-strip { grid-template-columns: repeat(5, 1fr); } }

        .deck-workspace { 
          display: grid; 
          grid-template-columns: 1fr; 
          gap: 1rem; 
          opacity: 0;
          transition: opacity 0.8s ease;
        }
        .deck-workspace.active { opacity: 1; }
        @media (min-width: 1024px) { .deck-workspace { grid-template-columns: 340px 1fr; gap: 1.5rem; } }

        .terminal-panel {
          background: #060907;
          border: 1px solid rgba(0, 255, 102, 0.2);
          border-radius: 4px;
          padding: 1rem;
          box-shadow: inset 0 0 15px rgba(0, 255, 102, 0.05), 0 4px 20px rgba(0,0,0,0.8);
          width: 100%;
          max-width: 100%;
          position: relative;
        }
        @media (min-width: 640px) { .terminal-panel { padding: 1.25rem; } }

        .terminal-panel::before {
          content: "+";
          position: absolute;
          top: 2px; left: 4px;
          font-size: 9px; color: rgba(0, 255, 102, 0.4);
        }

        .panel-header { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(0, 255, 102, 0.15); padding-bottom: 0.75rem; margin-bottom: 1rem; }
        .panel-title { font-size: 0.8rem; font-weight: 700; text-transform: uppercase; color: #ffaa00; letter-spacing: 0.08em; display: flex; align-items: center; gap: 0.5rem; }
        
        .data-row { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid rgba(0, 255, 102, 0.05); font-size: 0.8rem; background: transparent !important; }
        .data-label { color: #688a73 !important; text-transform: uppercase; font-size: 0.7rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; }
        .data-value { font-weight: 600; text-align: right; color: #d0edd9; }
        
        .forced-row-reset { background: transparent !important; padding-left: 0 !important; padding-right: 0 !important; border-radius: 0 !important; }
        .forced-label-reset { color: #688a73 !important; font-weight: 600 !important; }

        .matrix-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; text-align: left; }
        .matrix-table th { background: #0a0f0c; border-bottom: 1px solid rgba(0, 255, 102, 0.2); padding: 0.75rem 0.5rem; color: #688a73; text-transform: uppercase; font-size: 0.7rem; font-weight: 700; }
        .matrix-table td { padding: 0.75rem 0.5rem; border-bottom: 1px solid rgba(0, 255, 102, 0.08); color: #c2decb; }
        @media (min-width: 640px) { .matrix-table th, .matrix-table td { padding: 0.75rem 1rem; } }
        .matrix-table tr:nth-child(even) { background: #080c09; }
        .matrix-table tr:hover { background: rgba(0, 255, 102, 0.05); }

        @media (max-width: 580px) {
          .hide-on-mobile-cell { display: none !important; }
        }

        .txt-neon-green { color: #00ff66; text-shadow: 0 0 6px rgba(0,255,102,0.4); }
        .txt-solar-amber { color: #ffaa00; text-shadow: 0 0 4px rgba(255,170,0,0.3); }
        .txt-aviation-blue { color: #00f2ff; text-shadow: 0 0 4px rgba(0,242,255,0.3); }
        .status-bracket { font-size: 0.75rem; color: #334a3b; font-weight: 600; }
        .status-text { color: #00ff66; font-weight: 700; }
        .badge-mode-tactical { border: 1px solid rgba(0, 255, 102, 0.4); color: #00ff66; font-size: 10px; font-weight: 700; padding: 0.15rem 0.4rem; border-radius: 3px; background: rgba(0,255,102,0.03); }
        .rst-s-box { color: #00ff66; font-weight: 600; }
        .rst-r-box { color: #ff3333; font-weight: 600; }
        .panel-mono-data { font-weight: 600; }
        
        .scene-tooltip {
          background: #040605 !important;
          border: 1px solid #00ff66 !important;
          border-radius: 3px !important;
          padding: 0.75rem 1rem !important;
          font-family: monospace !important;
          font-size: 11px !important;
          box-shadow: 0 20px 40px rgba(0,0,0,0.9) !important;
          color: #c2decb !important;
          pointer-events: none !important;
          max-width: 240px !important;
          white-space: normal !important;
          line-height: 1.5 !important;
        }

        .terminal-cursor::after {
          content: "█";
          animation: blink 0.9s step-start infinite;
          margin-left: 2px;
        }
        @keyframes blink {
          50% { opacity: 0; }
        }
        
        .hud-pulse {
          animation: pulse-glow 2s infinite ease-in-out;
          font-weight: 700;
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.3; color: #334a3b; }
          50% { opacity: 1; color: #00ff66; text-shadow: 0 0 10px rgba(0, 255, 102, 0.6); }
        }
      `}} />

      {/* Header */}
      <header style={{ 
        display: "flex", 
        flexDirection: isMobileScreen ? "column" : "row",
        alignItems: isMobileScreen ? "flex-start" : "center",
        justifyContent: "space-between", 
        borderBottom: "1px solid rgba(0, 255, 102, 0.2)", 
        paddingBottom: "1rem", 
        marginBottom: "1rem",
        gap: isMobileScreen ? "0.75rem" : "0px"
      }}>
        <div>
          <h1 style={{ fontSize: isMobileScreen ? "1.1rem" : "1.35rem", fontWeight: 700, color: "#00ff66", display: "flex", alignItems: "center", gap: "0.6rem", letterSpacing: "-0.01em", textShadow: "0 0 6px rgba(0,255,102,0.3)" }}>
            <Radio style={{ width: "20px", height: "20px", color: "#ffaa00" }} /> 
            <span className={mainTitleText.length < targetTitle.length ? "terminal-cursor" : ""}>{mainTitleText}</span>
          </h1>
          <p style={{ fontSize: "0.65rem", color: "#425e4c", marginTop: "0.4rem", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, minHeight: "12px" }}>
            <span className={mainTitleText.length >= targetTitle.length && subTitleText.length < targetSubtitle.length ? "terminal-cursor" : ""}>{subTitleText}</span>
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignSelf: isMobileScreen ? "flex-end" : "center" }}>
          <button 
            onClick={() => parseLiveQrzData()}
            style={{ background: "transparent", border: "none", outline: "none", cursor: "pointer" }}
          >
            <span className="status-bracket">[<span className="status-text">{loading ? "SYNCING" : "SYS_OK"}</span>]</span>
          </button>
          <span className="status-bracket">[<span className="status-text" style={{ color: "#ffaa00" }}>{isLiveStream ? "LIVE_FEED" : "STANDBY"}</span>]</span>
        </div>
      </header>

      {/* Vibe Coded Tactical Core Status Banner */}
      <section style={{
        background: "rgba(0, 255, 102, 0.02)",
        border: "1px dashed rgba(0, 255, 102, 0.15)",
        borderRadius: "4px",
        padding: "0.5rem 0.75rem",
        marginBottom: "1.5rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: "0.65rem",
        fontWeight: 600,
        letterSpacing: "0.08em",
        color: "#4e6e58",
        flexWrap: "wrap",
        gap: "0.5rem"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <span style={{ color: "#00ff66", display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#00ff66", display: "inline-block" }}></span>
            RADAR_ENGINE // QUANTUM_GRID_ACTIVE
          </span>
          <span style={{ color: "rgba(0, 255, 102, 0.15)" }} className="hide-on-mobile-cell">|</span>
          <span className="hide-on-mobile-cell">STACK_ALLOC: <span style={{ color: "#8cb398" }}>0x7FFEE3A2F1B0</span></span>
          <span style={{ color: "rgba(0, 255, 102, 0.15)" }} className="status-bracket hide-on-mobile-cell">@</span>
          <span className="hide-on-mobile-cell">COMPILING: <span style={{ color: "#00ff66" }}>SUCCESS</span></span>
          <span style={{ color: "rgba(0, 255, 102, 0.15)" }}>|</span>
          
          <button 
            onClick={handleToggleAudioSystem}
            style={{
              background: "transparent",
              border: "none",
              color: audioEnabled ? "#00ff66" : "#3c5243",
              cursor: "pointer",
              fontFamily: "monospace",
              fontSize: "0.65rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: 0,
              outline: "none"
            }}
          >
            {audioEnabled ? <Volume2 style={{ width: "12px", height: "12px" }} /> : <VolumeX style={{ width: "12px", height: "12px" }} />}
            {audioEnabled ? "[ AUDIO: ON ]" : "[ AUDIO: OFF ]"}
          </button>
        </div>
        <div style={{ 
          border: "1px solid rgba(0, 255, 102, 0.2)", 
          color: "rgba(0, 255, 102, 0.4)", 
          fontSize: "9px", 
          padding: "0.05rem 0.4rem", 
          borderRadius: "3px", 
          background: "transparent",
          textTransform: "uppercase",
          fontWeight: 800
        }}>
          BUILT BY AI VIBES
        </div>
      </section>

      {/* Telemetry Strip */}
      <section className={`telemetry-strip ${showTelemetry ? "active" : ""}`}>
        <div className="terminal-panel" style={{ padding: "0.85rem 1rem" }}>
          <span style={{ fontSize: "0.65rem", color: "#688a73", textTransform: "uppercase", display: "block", fontWeight: 700, letterSpacing: "0.05em" }}>ACTIVE BAND</span>
          <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#00f2ff", marginTop: "0.2rem" }}>{stats.currentBand}</div>
        </div>

        <div className="terminal-panel" style={{ padding: "0.85rem 1rem" }}>
          <span style={{ fontSize: "0.65rem", color: "#688a73", textTransform: "uppercase", display: "block", fontWeight: 700, letterSpacing: "0.05em" }}>RIG MODE</span>
          <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#ffaa00", marginTop: "0.2rem" }}>{stats.currentMode}</div>
        </div>

        <div className="terminal-panel" style={{ padding: "0.85rem 1rem" }}>
          <span style={{ fontSize: "0.65rem", color: "#688a73", textTransform: "uppercase", display: "block", fontWeight: 700, letterSpacing: "0.05em" }}>TOTAL QSOs</span>
          <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#00ff66", marginTop: "0.2rem" }}>{stats.totalQsos}</div>
        </div>

        <div className="terminal-panel" style={{ padding: "0.85rem 1rem" }}>
          <span style={{ fontSize: "0.7rem", color: "#688a73", textTransform: "uppercase", display: "block", fontWeight: 700, letterSpacing: "0.05em" }}>CONFIRMED</span>
          <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#a855f7", marginTop: "0.2rem" }}>{stats.confirmed}</div>
        </div>

        <div className="terminal-panel" style={{ padding: "0.85rem 1rem" }}>
          <span style={{ fontSize: "0.7rem", color: "#688a73", textTransform: "uppercase", display: "block", fontWeight: 700, letterSpacing: "0.05em" }}>COUNTRIES DXCC</span>
          <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#a3e635", marginTop: "0.2rem" }}>{stats.dxcc}</div>
        </div>
      </section>

      {/* Main Workspace Split Grid Layout */}
      <main className={`deck-workspace ${showWorkspace ? "active" : ""}`}>
        
        {/* Left Column Stack */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          
          {/* Card 1: Shack Gear */}
          <div className="terminal-panel">
            <div className="panel-header">
              <div className="panel-title">
                <Cpu style={{ width: "16px", height: "16px", color: "#00ff66" }} /> HAMSHACK GEAR
              </div>
              <ChevronRight style={{ width: "14px", height: "14px", color: "#223b2b" }} />
            </div>
            <div className="data-row"><span className="data-label">STATION QTH</span><span className="data-value">OTTAWA, KS</span></div>
            <div className="data-row"><span className="data-label">MAIN RIG</span><span className="data-value">YAESU FT-991</span></div>
            <div className="data-row"><span className="data-label">ANTENNA</span><span className="data-value">ISOTRON 20M</span></div>
            <div className="data-row" style={{ borderBottom: "none" }}><span className="data-label">ARCH SUITE</span><span className="data-value">XUBUNTU/HAM</span></div>
          </div>

          {/* Card 2: Space & Solar Weather Data System */}
          <div className="terminal-panel">
            <div className="panel-header">
              <div className="panel-title" style={{ color: "#ffaa00" }}>
                <Sun style={{ width: "16px", height: "16px" }} /> SOLAR WEATHER (N0NBH)
              </div>
            </div>
            
            <div className="data-row">
              <span className="data-label">SOLAR FLUX (SFI)</span>
              <span className="data-value txt-solar-amber">{sfi}</span>
            </div>
            <div className="data-row">
              <span className="data-label">SUNSPOT NUMBER</span>
              <span className="data-value panel-mono-data">{sunspots}</span>
            </div>
            <div className="data-row">
              <span className="data-label">A INDEX</span>
              <span className="data-value panel-mono-data" style={{ color: "#475c4f" }}>{aIndex}</span>
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

            <div style={{ color: "#ffaa00", fontSize: "0.7rem", fontWeight: "700", borderTop: "1px dashed rgba(0, 255, 102, 0.15)", paddingTop: "0.75rem", paddingBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              HF Band Real-Time Profiles
            </div>

            <div className="data-row">
              <span className="data-label">80M Propagation</span>
              <span className={`data-value ${getColorClass(getPropRating("80M"))}`}>[{getPropRating("80M")}]</span>
            </div>
            <div className="data-row">
              <span className="data-label">40M Propagation</span>
              <span className={`data-value ${getColorClass(getPropRating("40M"))}`}>[{getPropRating("40M")}]</span>
            </div>
            <div className="data-row">
              <span className="data-label">30M Propagation</span>
              <span className={`data-value ${getColorClass(getPropRating("30M"))}`}>[{getPropRating("30M")}]</span>
            </div>
            <div className="data-row forced-row-reset">
              <span className="data-label forced-label-reset">20M Propagation</span>
              <span className={`data-value ${getColorClass(getPropRating("20M"))}`}>[{getPropRating("20M")}]</span>
            </div>
            <div className="data-row">
              <span className="data-label">17M Propagation</span>
              <span className={`data-value ${getColorClass(getPropRating("17M"))}`}>[{getPropRating("17M")}]</span>
            </div>
            <div className="data-row">
              <span className="data-label">15M Propagation</span>
              <span className={`data-value ${getColorClass(getPropRating("15M"))}`}>[{getPropRating("15M")}]</span>
            </div>
            <div className="data-row">
              <span className="data-label">12M Propagation</span>
              <span className={`data-value ${getColorClass(getPropRating("12M"))}`}>[{getPropRating("12M")}]</span>
            </div>
            <div className="data-row" style={{ borderBottom: "none" }}>
              <span className="data-label">10M Propagation</span>
              <span className={`data-value ${getColorClass(getPropRating("10M"))}`}>[{getPropRating("10M")}]</span>
            </div>
          </div>

          {/* Card 3: Engine Statistics Metrics System */}
          <div className="terminal-panel">
            <div className="panel-header">
              <div className="panel-title">
                <Sliders style={{ width: "16px", height: "16px", color: "#00ff66" }} /> ENGINE.STAT
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
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          
          {/* HARDWARE-ACCELERATED 3D WEBGL GLOBE CANVAS CONTAINER */}
          <div 
            ref={containerRef}
            className="terminal-panel" 
            style={{ 
              padding: "0.5rem", 
              background: "#020403", 
              position: "relative", 
              height: isMobileScreen ? "340px" : "520px", 
              overflow: "hidden", 
              display: "flex", 
              flexDirection: "column",
              border: "1px solid rgba(0, 255, 102, 0.25)"
            }}
          >
            {/* Legend Overlay HUD */}
            <div style={{ position: "absolute", top: "0.75rem", left: "1rem", zIndex: 20, pointerEvents: "none", width: "calc(100% - 2rem)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                <div className="panel-title" style={{ color: "#ffffff", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                  <Globe style={{ width: "14px", height: "14px", color: "#00ff66" }} /> 
                  <span>GEOGRAPHIC VECTOR TELEMETRY ARRAY</span>
                  <span className="hud-pulse" style={{ fontSize: "9px", letterSpacing: "0.05em" }}>[ HUD // TRACKER_ENGAGED ]</span>
                </div>
              </div>
              <div style={{ fontFamily: "monospace", fontSize: "9px", color: "#4e6e58", marginTop: "0.25rem", display: "flex", gap: "0.75rem" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  <span style={{ width: "5px", height: "5px", backgroundColor: "#00f2ff", borderRadius: "50%", display: "inline-block" }}></span>
                  DOMESTIC
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  <span style={{ width: "5px", height: "5px", backgroundColor: "#ff9100", borderRadius: "50%", display: "inline-block" }}></span>
                  DX SECTOR
                </span>
              </div>
            </div>
            
            <div style={{ width: "100%", height: "100%", cursor: "grab" }}>
              {showWorkspace && (
                <GlobeEngine
                  width={dimensions.width}
                  height={dimensions.height}
                  backgroundColor="#020403"
                  
                  polygonsData={landmasses}
                  polygonCapColor={() => "#07120a"} 
                  polygonSideColor={() => "#0f2114"} 
                  polygonStrokeColor={() => "#183620"} 
                  
                  arcsData={geoArcs}
                  arcColor="color"
                  arcDashLength={0.45}
                  arcDashGap={0.1}
                  arcDashAnimateTime={1400} 
                  arcStroke={0.4}
                  arcsTransitionDuration={0}
                  
                  ringsData={geoArcs}
                  ringColor="color"
                  ringMaxRadius={2.8}
                  ringPropagationSpeed={1.5}
                  ringRepeatPeriod={1600}
                  
                  showAtmosphere={true}
                  atmosphereColor="#00ff66"
                  atmosphereAltitude={0.15}
                  
                  labelLabel={(d: any) => `
                    <div class="scene-tooltip">
                      <div style="font-weight: 700; color: ${d.color}; margin-bottom: 0.25rem; text-transform: uppercase; letter-spacing: 0.02em;">SECTOR: ${d.gridKey}</div>
                      <div style="color: #688a73; margin-bottom: 0.2rem;">COUNTRY: <span style="color: #ffffff; font-weight: 600;">${d.country}</span></div>
                      <div style="color: #688a73; margin-bottom: 0.2rem;">OPERATORS: <span style="color: #00ffca; font-weight: 600;">${d.operators}</span></div>
                      <div style="border-top: 1px dashed rgba(0,255,102,0.2); margin-top: 0.35rem; padding-top: 0.25rem; color: #4e6e58; font-size: 10px;">
                        TOTAL QSOs: <span style="color: #00ff66; font-weight: 700;">${d.count}</span>
                      </div>
                    </div>
                  `}
                  
                  arcLabel={(d: any) => `
                    <div class="scene-tooltip">
                      <div style="font-weight: 700; color: ${d.color}; margin-bottom: 0.25rem; text-transform: uppercase; letter-spacing: 0.02em;">PATH: BASE &rarr; ${d.gridKey}</div>
                      <div style="color: #688a73; margin-bottom: 0.2rem;">REGION: <span style="color: #ffffff; font-weight: 600;">${d.country}</span></div>
                      <div style="color: #688a73; margin-bottom: 0.2rem;">STATION OPERATORS: <span style="color: #00ffca; font-weight: 600;">${d.operators}</span></div>
                      <div style="border-top: 1px dashed rgba(0,255,102,0.2); margin-top: 0.35rem; padding-top: 0.25rem; color: #4e6e58; font-size: 10px;">
                        TOTAL QSOs: <span style="color: #00ff66; font-weight: 700;">${d.count}</span>
                      </div>
                    </div>
                  `}
                />
              )}
            </div>
          </div>

          {/* Complete Live Log Ledger */}
          <div className="terminal-panel" style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div className="panel-header">
              <div className="panel-title">
                <History style={{ width: "16px", height: "16px", color: "#00ff66" }} /> LIVE LOOK AT MOST RECENT QSOs
              </div>
              <span style={{ fontSize: "0.7rem", color: "#ffaa00", fontWeight: 600, letterSpacing: "0.02em" }} className="hide-on-mobile-cell">ANTI_CHRONO_INDEX_ACTIVE</span>
            </div>
            
            <div style={{ overflowX: "auto", marginTop: "0.5rem" }}>
              <table className="matrix-table">
                <thead>
                  <tr>
                    <th>CALLSIGN</th>
                    <th className="hide-on-mobile-cell">DATE (UTC)</th>
                    <th className="hide-on-mobile-cell">TIME</th>
                    <th>BAND</th>
                    <th>MODE</th>
                    <th style={{ textAlign: "center" }}>RST (S/R)</th>
                    <th>GRID LOC</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: "4rem", textAlign: "center", color: "#ffaa00", fontStyle: "italic" }}>
                        &gt;&gt; Live log stream parsing pending... Standby for secure JSON server handshake.
                      </td>
                    </tr>
                  ) : (
                    logs.map((qso, index) => (
                      <tr key={index}>
                        <td style={{ fontWeight: "700", color: "#ffffff", fontSize: "0.9rem" }} className="panel-mono-data">
                          {qso.callsign}
                        </td>
                        <td style={{ color: "#688a73" }} className="hide-on-mobile-cell">{qso.date}</td>
                        <td style={{ fontWeight: "500" }} className="hide-on-mobile-cell">{qso.time}</td>
                        <td style={{ fontWeight: "500" }}>{qso.band}</td>
                        <td>
                          <span className="badge-mode-tactical">{qso.mode}</span>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <span className="rst-s-box">{qso.rstS}</span>
                          <span style={{ color: "rgba(0, 255, 102, 0.2)", margin: "0 0.3rem" }}>|</span>
                          <span className="rst-r-box">{qso.rstR}</span>
                        </td>
                        <td style={{ color: "#688a73", fontWeight: "500" }} className="panel-mono-data">
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
