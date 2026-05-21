"use client";
import React, { useEffect, useState } from "react";
import { Radio, Laptop, Compass, History, Signal, Globe, Cpu, Sliders, ChevronRight, Sun, ShieldCheck } from "lucide-react";

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
    totalQsos: "1,058",
    confirmed: "833",
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

  useEffect(() => {
    async function parseLiveQrzData() {
      try {
        const res = await fetch("/api/qrz");
        if (!res.ok) throw new Error("Proxy offline");
        const json = await res.json();
        if (json.error || !json.data) throw new Error("No data");

        const cleanText = json.data.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

        const countMatch = cleanText.match(/COUNT=([^&]*)/i);
        const dxccMatch = cleanText.match(/DXCC_COUNT=([^&]*)/i);

        const liveCount = countMatch ? countMatch[1].split('&')[0] : "1,058";
        const liveDxcc = dxccMatch ? dxccMatch[1].split('&')[0] : "74";

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
          setStats({
            totalQsos: liveCount,
            confirmed: "833",
            dxcc: liveDxcc,
            currentBand: newestFifteen[0].band ? `${newestFifteen[0].band} Meters` : "20 Meters",
            currentMode: newestFifteen[0].mode || "FT8"
          });
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
        @media (min-width: 1024px) { .deck-workspace { grid-template-columns: 320px 1fr; } }

        .terminal-panel {
          background: #121212;
          border: 1px solid #262626;
          border-radius: 8px;
          padding: 1.25rem;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2);
          width: 100%;
          max-width: 100%;
        }

        .terminal-panel-interactive {
          background: #121212 !important;
          border: 1px solid #262626 !important;
          border-radius: 8px;
          padding: 1.25rem !important;
          text-decoration: none !important;
          color: inherit !important;
          cursor: pointer !important;
          transition: all 0.25s ease !important;
          display: flex !important;
          flex-direction: column !important;
          justify-content: flex-start !important;
        }
        .terminal-panel-interactive:hover {
          border-color: #f59e0b !important;
          background: #171717 !important;
          transform: translateY(-3px) !important;
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
        .font-mono-data { font-family: monospace; font-weight: 600; }
      `}} />

      {/* Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #262626", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
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

      {/* Telemetry Strip */}
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

        <a
          href="https://www.qsomap.com/QSOmapProduction/qsomapforosmQRZ.php?call=AF0DB"
          target="_blank"
          rel="noopener noreferrer"
          className="terminal-panel-interactive"
        >
          <span style={{ fontSize: "0.9rem", color: "#e5e5e5", textTransform: "uppercase", display: "block", fontWeight: 700, letterSpacing: "0.03em" }}>
            COUNTRIES CONTACTED ↗
          </span>
          <div style={{ fontSize: "1.65rem", fontWeight: 800, color: "#06b6d4", marginTop: "0.35rem" }}>
            {stats.dxcc}
          </div>
        </a>
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

          {/* Card 2: Restored Complete Space & Solar Weather Data System */}
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
              <span className="data-value font-mono-data" style={{ color: "#ffffff" }}>{sunspots}</span>
            </div>
            <div className="data-row">
              <span className="data-label">A INDEX</span>
              <span className="data-value font-mono-data" style={{ color: "#a3a3a3" }}>{aIndex}</span>
            </div>
            <div className="data-row">
              <span className="data-label">K INDEX</span>
              <span className="data-value font-mono-data txt-neon-green">{kIndex}</span>
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

          {/* Card 3: Restored Engine Statistics Metrics System */}
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

        {/* Right Column Stack: Complete Live Log Ledger */}
        <div className="terminal-panel" style={{ display: "flex", flexDirection: "column" }}>
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
      </main>
    </div>
  );
}
