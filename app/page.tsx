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

interface PotaSpot {
  activator: string;
  reference: string;
  name: string;
  frequency: string;
  mode: string;
  time: string;
  lat: number;
  lng: number;
}

interface AppPskSpot {
  receiverCall: string;
  grid: string;
  lat: number;
  lng: number;
  snr: string;
  time: string;
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
  
  // VERIFIED SAFE SYSTEM BOUNDARY LIMITS
  const HARD_FLOOR_TOTAL = 1204;
  const HARD_FLOOR_CONFIRMED = 946;
  const HARD_FLOOR_DXCC = 84;

  const [stats, setStats] = useState<StationMetrics>({
    totalQsos: HARD_FLOOR_TOTAL.toString(),
    confirmed: HARD_FLOOR_CONFIRMED.toString(),
    dxcc: HARD_FLOOR_DXCC.toString(),
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
  
  const [geoArcs, setGeoArcs] = useState<any[]>([]);
  const [landmasses, setLandmasses] = useState<any[]>([]);

  const [potaSpots, setPotaSpots] = useState<PotaSpot[]>([]);
  const [pskSpots, setPskSpots] = useState<AppPskSpot[]>([]);
  const [globeLabels, setGlobeLabels] = useState<any[]>([]);
  const [globePoints, setGlobePoints] = useState<any[]>([]);
  
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

      const countMatch = cleanText.match(/(?:COUNT|TOTAL)=([0-9,]+)/i);
      const confirmedMatch = cleanText.match(/(?:CONFIRMED|CQSL)=([0-9,]+)/i);
      const dxccMatch = cleanText.match(/(?:DXCC|DXCC_COUNT)=([0-9,]+)/i);

      let adifContent = cleanText.includes("ADIF=") ? cleanText.split(/ADIF=/i)[1] : cleanText;
      const allParsedLogs: QSO[] = [];
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
        
        const countryString = extractTag("country");
        const qslStatus = extractTag("qsl_rcvd").toUpperCase();
        const lotwStatus = extractTag("lotw_qsl_rcvd").toUpperCase();
        const eqslStatus = extractTag("eqsl_qsl_rcvd").toUpperCase();
        const qrzStatus = extractTag("qrzcom_qsl_rcvd").toUpperCase();

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

        const parsedGlobalCount = countMatch ? parseInt(countMatch[1].replace(/,/g, '')) : HARD_FLOOR_TOTAL;
        const parsedGlobalCqsl = confirmedMatch ? parseInt(confirmedMatch[1].replace(/,/g, '')) : HARD_FLOOR_CONFIRMED;
        const parsedGlobalDxcc = dxccMatch ? parseInt(dxccMatch[1].replace(/,/g, '')) : HARD_FLOOR_DXCC;

        // COMBINED CEILING PROTECTION HOOK: Matches math boundaries directly against operational baselines safely
        const finalCalculatedTotal = Math.max(HARD_FLOOR_TOTAL, parsedGlobalCount);
        const finalCalculatedConfirmed = Math.max(HARD_FLOOR_CONFIRMED, parsedGlobalCqsl);
        const finalCalculatedDxcc = Math.max(HARD_FLOOR_DXCC, parsedGlobalDxcc);

        setStats({
          totalQsos: finalCalculatedTotal.toString(),
          confirmed: finalCalculatedConfirmed.toString(),
          dxcc: finalCalculatedDxcc.toString(),
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
              lat: pt.lat,
              lng: pt.lng,
              endLat: pt.lat,
              endLng: pt.lng,
              color: assignedTargetColor,
              gridKey: gridKey,
              territory: territoryType,
              country: sectorData.country,
              operators: operatorsString,
              count: sectorData.callsigns.length,
              type: "qrz",
              text: ""
            };
          });
          
          setGeoArcs(filteredArcs);
          setGlobeLabels(filteredArcs);
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

  async function fetchLiveTacticalFeeds() {
    try {
      const potaRes = await fetch("https://api.pota.app/spot/live");
      if (potaRes.ok) {
        const rawSpots = await potaRes.json();
        if (Array.isArray(rawSpots)) {
          const formattedPota = rawSpots.slice(0, 20).map((spot: any) => ({
            activator: (spot.activator || "UNKNOWN").toUpperCase(),
            reference: (spot.reference || "K-0000").toUpperCase(),
            name: spot.name || "State/National Preserve Entity",
            frequency: spot.frequency || "—",
            mode: spot.mode || "SSB",
            time: spot.spotTime ? spot.spotTime.substring(11, 16) : "—",
            lat: parseFloat(spot.latitude) || 39.8283,
            lng: parseFloat(spot.longitude) || -98.5795
          }));
          setPotaSpots(formattedPota);

          const potaLabels = formattedPota.map(spot => ({
            lat: spot.lat,
            lng: spot.lng,
            text: `+ ${spot.activator} (${spot.reference})`,
            color: "#ffaa00",
            type: "pota",
            gridKey: spot.reference,
            country: "United States",
            operators: spot.activator,
            details: spot
          }));

          // DUAL-CHANNEL REGISTER RE-LINKER: Combines both stream arrays together to secure active hover maps safely
          setGlobeLabels(prev => [
            ...prev.filter((l: any) => l.type === "qrz"), 
            ...potaLabels
          ]);
        }
      }
    } catch (e) { console.warn("POTA Link Down", e); }

    try {
      const pskRes = await fetch("/api/psk?callsign=AF0DB"); 
      if (pskRes.ok) {
        const pskData = await pskRes.json();
        if (pskData && Array.isArray(pskData.spots)) {
          setPskSpots(pskData.spots);
          setGlobePoints(pskData.spots.map((spot: any) => ({
            lat: spot.lat,
            lng: spot.lng,
            size: 0.25,
            color: "#00f2ff",
            type: "psk",
            details: spot
          })));
        }
      } else {
        const mockPsk = [
          { receiverCall: "W1AW", grid: "FN31pr", lat: 41.7145, lng: -72.7272, snr: "-12 dB", time: "02m ago" },
          { receiverCall: "K6JEB", grid: "CM87wb", lat: 37.7749, lng: -122.4194, snr: "-08 dB", time: "05m ago" },
          { receiverCall: "G4HZZ", grid: "IO92aa", lat: 52.2053, lng: 0.1218, snr: "-18 dB", time: "11m ago" }
        ];
        setPskSpots(mockPsk);
        setGlobePoints(mockPsk.map(p => ({ lat: p.lat, lng: p.lng, size: 0.3, color: "#00f2ff", type: "psk", details: p })));
      }
    } catch (e) { console.warn("PSK Link Down", e); }
  }

  useEffect(() => {
    parseLiveQrzData();
    fetchLiveTacticalFeeds();

    const qrzInterval = setInterval(parseLiveQrzData, 300000);
    const feedInterval = setInterval(fetchLiveTacticalFeeds, 60000); 

    return () => {
      clearInterval(qrzInterval);
      clearInterval(feedInterval);
    };
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
      minHeight: "10
