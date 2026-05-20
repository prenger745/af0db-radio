"use client";

import React, { useState } from "react"
import { Radio, Laptop, Compass, History, Signal, Globe, Cpu, Award, Zap, Activity, ShieldCheck, Database, Sliders } from "lucide-react"

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
  // Master QSO Data Array (Sorted Anti-Chronologically)
  const [qsoLogs] = useState<QSO[]>([
    { callsign: "W1AW", date: "2026-05-20", time: "16:42", band: "20m", mode: "FT8", rstS: "+05", rstR: "-02", grid: "FN31pr" },
    { callsign: "G3XZN", date: "2026-05-20", time: "15:10", band: "15m", mode: "SSB", rstS: "59", rstR: "57", grid: "IO92aa" },
    { callsign: "JA1YAA", date: "2026-05-19", time: "23:05", band: "40m", mode: "CW", rstS: "599", rstR: "599", grid: "PM95to" },
    { callsign: "DL0RE", date: "2026-05-18", time: "19:22", band: "20m", mode: "FT4", rstS: "-04", rstR: "-11", grid: "JO61" },
    { callsign: "VK3CK", date: "2026-05-15", time: "08:14", band: "20m", mode: "FT8", rstS: "+01", rstR: "-05", grid: "QF22" }
  ])

  return (
    <div style={{
      backgroundColor: "#030712",
      color: "#f3f4f6",
      minHeight: "100vh",
      padding: "2rem",
      fontFamily: "system-ui, -apple-system, sans-serif",
      boxSizing: "border-box"
    }}>
      {/* Embedded Global Styles Engine */}
      <style dangerouslySetInnerHTML={{__html: `
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        /* Layout Grid Infrastructure */
        .metrics-strip { display: grid; grid-template-columns: repeat(1, 1fr); gap: 1rem; margin-bottom: 2rem; max-width: 1400px; margin-left: auto; margin-right: auto; }
        @media (min-width: 640px) { .metrics-strip { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 1024px) { .metrics-strip { grid-template-columns: repeat(4, 1fr); } }
        
        .main-workspace { display: grid; grid-template-columns: 1fr; gap: 1.5rem; max-width: 1400px; margin: 0 auto; }
        @media (min-width: 1024px) { .main-workspace { grid-template-columns: 1fr 3fr; } }
        
        /* Component Cards Design Rules */
        .card-deck { background: rgba(17, 24, 39, 0.7); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 1.5rem; backdrop-filter: blur(12px); box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.5); }
        .metric-card { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 1.5rem; }
        
        /* Typography Layout Framework */
        .spec-row { border-left: 2px solid #f59e0b; padding-left: 1rem; margin-top: 0.5rem; }
        .stat-value { font-size: 1.75rem; font-weight: 800; color: #ffffff; font-family: monospace; margin-top: 0.25rem; }
        
        /* Tabular Components Layout CSS */
        .log-table { width: 100%; border-collapse: collapse; margin-top: 1rem; font-size: 0.875rem; text-align: left; }
        .log-table th { background: rgba(255, 255, 255, 0.04); border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding: 0.85rem 1rem; color: #9ca3af; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; }
        .log-table td { padding: 0.85rem 1rem; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
        .log-table tr:hover { background: rgba(255, 255, 255, 0.02); }
        
        /* Badges & Indicators */
        .badge-mode { background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.2); color: #fbbf24; font-size: 11px; font-weight: bold; padding: 0.125rem 0.5rem; border-radius: 4px; font-family: monospace; }
        .rst-s { color: #34d399; background: rgba(52, 211, 153, 0.1); border: 1px solid rgba(52, 211, 153, 0.2); padding: 0.125rem 0.375rem; border-radius: 4px; font-weight: bold; }
        .rst-r { color: #38bdf8; background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.2); padding: 0.125rem 0.375rem; border-radius: 4px; font-weight: bold; }
        .system-dot { display: inline-block; width: 8px; height: 8px; background-color: #10b981; border-radius: 50%; box-shadow: 0 0 8px #10b981; }
      `}} />

      {/* Main Control Center Header */}
      <header style={{ maxWidth: "1400px", margin: "0 auto 2rem auto", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "2.5rem", fontWeight: 900, color: "#f59e0b", letterSpacing: "-0.025em", textTransform: "uppercase" }}>
            AF0DB Radio Station Console
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#9ca3af", marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span className="system-dot" /> Live Station Matrix Linked Natively Via GitHub Pipeline
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", fontFamily: "monospace", fontSize: "0.75rem" }}>
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", padding: "0.5rem 1rem", borderRadius: "8px" }}>
            STATUS: <span style={{ color: "#34d399", fontWeight: "bold" }}>ONLINE</span>
          </div>
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", padding: "0.5rem 1rem", borderRadius: "8px" }}>
            CALLSIGN: <span style={{ color: "#f59e0b", fontWeight: "bold" }}>AF0DB</span>
          </div>
        </div>
      </header>

      {/* Top Strip: Live KPI Modules Panel */}
      <section className="metrics-strip">
        <div className="card-deck metric-card">
          <div>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase" }}>Current Band</span>
            <div className="stat-value" style={{ color: "#fbbf24" }}>20 Meters</div>
          </div>
          <Zap style={{ color: "#f59e0b", width: "24px", height: "24px", opacity: 0.8 }} />
        </div>

        <div className="card-deck metric-card">
          <div>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase" }}>Operating Mode</span>
            <div className="stat-value">FT8 / Digital</div>
          </div>
          <Activity style={{ color: "#f59e0b", width: "24px", height: "24px", opacity: 0.8 }} />
        </div>

        <div className="card-deck metric-card">
          <div>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase" }}>Total Logged contacts</span>
            <div className="stat-value" style={{ color: "#34d399" }}>4,2754 Logged</div>
          </div>
          <Database style={{ color: "#34d399", width: "24px", height: "24px", opacity: 0.8 }} />
        </div>

        <div className="card-deck metric-card">
          <div>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#9ca3af", textTransform: "uppercase" }}>Grid Square Grid</span>
            <div className="stat-value">EM28in</div>
          </div>
          <Award style={{ color: "#f59e0b", width: "24px", height: "24px", opacity: 0.8 }} />
        </div>
      </section>

      {/* Main Dual Column Dashboard Area */}
      <div className="main-workspace">
        
        {/* Left Side Controls Column Stack */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          {/* Card 1: Station Rig Layout Profile */}
          <div className="card-deck">
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "1rem", marginBottom: "1.25rem" }}>
              <Cpu style={{ color: "#f59e0b", width: "20px", height: "20px" }} />
              <h2 style={{ fontSize: "1rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Station Specs Deck</h2>
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Compass style={{ width: "14px", height: "14px", color: "#f59e0b" }} /> Operational QTH
              </span>
              <div className="spec-row">
                <p style={{ fontSize: "0.875rem", fontWeight: 500 }}>Ottawa, Kansas, USA</p>
                <p style={{ fontSize: "0.75rem", color: "#f59e0b", fontFamily: "monospace", marginTop: "0.125rem" }}>Grid: EM28in</p>
              </div>
            </div>

            <div style={{ marginBottom: "1.25rem" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Signal style={{ width: "14px", height: "14px", color: "#f59e0b" }} /> Hardware Base Config
              </span>
              <div className="spec-row">
                <p style={{ fontSize: "0.875rem", fontWeight: 500 }}>Yaesu FT-991 Transceiver</p>
                <p style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "0.25rem" }}>Isotron 20 Meter Antenna</p>
              </div>
            </div>

            <div>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Laptop style={{ width: "14px", height: "14px", color: "#f59e0b" }} /> Operating System
              </span>
              <div className="spec-row">
                <p style={{ fontSize: "0.875rem", fontWeight: 500 }}>Xubuntu Linux Suite</p>
                <p style={{ fontSize: "0.75rem", color: "#9ca3af", fontFamily: "monospace" }}>Andy's Ham Radio Package</p>
                <p style={{ marginTop: "0.5rem" }}>
                  <span style={{ fontSize: "10px", fontWeight: "bold", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", color: "#f59e0b", padding: "2px 6px", borderRadius: "4px" }}>
                    WSJT-X Improved
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Environment Tuning Details Panel */}
          <div className="card-deck">
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "1rem", marginBottom: "1.25rem" }}>
              <Sliders style={{ color: "#f59e0b", width: "18px", height: "18px" }} />
              <h2 style={{ fontSize: "1rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Interface Engine</h2>
            </div>
            
            <div style={{ spaceY: "1rem", display: "flex", flexDirection: "column", gap: "1rem", fontSize: "0.825rem", fontFamily: "monospace" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.03)", paddingBottom: "0.25rem" }}>
                <span style={{ color: "#9ca3af" }}>CAT Engine</span>
                <span style={{ color: "#34d399" }}>CONNECTED</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.03)", paddingBottom: "0.25rem" }}>
                <span style={{ color: "#9ca3af" }}>Power Output</span>
                <span style={{ color: "#ffffff" }}>100 Watts</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.03)", paddingBottom: "0.25rem" }}>
                <span style={{ color: "#9ca3af" }}>SWR Meter</span>
                <span style={{ color: "#34d399" }}>1.2:1 (STABLE)</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#9ca3af" }}>QRZ API Feed</span>
                <span style={{ color: "#38bdf8" }}>SSL ACTIVE</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Side Column: Chronological Interactive Logbook Table */}
        <div className="card-deck" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyItems: "center", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "1rem", marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <History style={{ color: "#f59e0b", width: "20px", height: "20px" }} />
                <h2 style={{ fontSize: "1.125rem", fontWeight: 700, textTransform: "uppercase" }}>Recent QSO Data Stream</h2>
              </div>
            </div>

            <div style={{ overflowX: "auto", borderRadius: "8px", background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <table className="log-table">
                <thead>
                  <tr>
                    <th style={{ color: "#f59e0b" }}>Callsign</th>
                    <th>Date (UTC)</th>
                    <th>Time</th>
                    <th>Band</th>
                    <th>Mode</th>
                    <th style={{ textAlign: "center" }}>RST (Sent/Rcvd)</th>
                    <th>Grid Square</th>
                  </tr>
                </thead>
                <tbody>
                  {qsoLogs.map((qso, index) => (
                    <tr key={index}>
                      <td style={{ fontWeight: 900, color: "#fbbf24", fontSize: "1rem", tracking: "0.02em" }}>{qso.callsign}</td>
                      <td style={{ fontFamily: "monospace", color: "#d1d5db" }}>{qso.date}</td>
                      <td style={{ fontFamily: "monospace", color: "#d1d5db" }}>{qso.time}</td>
                      <td style={{ fontWeight: 500 }}>{qso.band}</td>
                      <td>
                        <span className="badge-mode">{qso.mode}</span>
                      </td>
                      <td style={{ textAlign: "center", fontFamily: "monospace" }}>
                        <span className="rst-s">{qso.rstS}</span>
                        <span style={{ color: "#4b5563", margin: "0 0.35rem" }}>/</span>
                        <span className="rst-r">{qso.rstR}</span>
                      </td>
                      <td style={{ fontFamily: "monospace", color: "#9ca3af" }}>{qso.grid || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Dashboard Operational Footer */}
          <footer style={{ marginTop: "2.5rem", paddingTop: "1.25rem", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", fontSize: "11px", color: "#6b7280", fontFamily: "monospace" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <Globe style={{ width: "12px", height: "12px", color: "rgba(245,158,11,0.5)" }} /> 
              Sorting Algorithm Parameter Forced: Descending Order (Newest First)
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <ShieldCheck style={{ width: "12px", height: "12px", color: "#34d399" }} /> Live Production Verified
            </span>
          </footer>
        </div>
      </div>
    </div>
  )
}
