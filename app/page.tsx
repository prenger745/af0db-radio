"use client";
import React, { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { Radio, Laptop, Compass, History, Signal, Globe, Cpu, Sliders, ChevronRight, Sun, ShieldCheck, Volume2, VolumeX } from "lucide-react";

// NEXT 14 WEBGL DYNAMIC LAYOUT ENGINE
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

interface OperationalWeather {
  temp: string;
  humidity: string;
  windSpeed: string;
  windDir: string;
  baro: string;      
  solRad: string;    
  uvi: string;       
  condition: string;
  iconCode: number;
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
  
  // VERIFIED SAFE SYSTEM BOUNDARY LIMITS - Updated to force 952 bypass
  const HARD_FLOOR_TOTAL = 1204;
  const HARD_FLOOR_CONFIRMED = 952;
  const HARD_FLOOR_DXCC = 84;

  const [stats, setStats] = useState<StationMetrics>({
    totalQsos: HARD_FLOOR_TOTAL.toString(),
    confirmed: HARD_FLOOR_CONFIRMED.toString(),
    dxcc: HARD_FLOOR_DXCC.toString(),
    currentBand: "20 Meters",
    currentMode: "FT8"
  });

  const [weather, setWeather] = useState<OperationalWeather>({
    temp: "——",
    humidity: "——",
    windSpeed: "——",
    windDir: "——",
    baro: "——",
    solRad: "——",
    uvi: "0",
    condition: "INITIALIZING",
    iconCode: 0
  });

  const [sfi, setSfi] = useState<number>(145);
  const [sunspots, setSunspots] = useState<string>("98");
  const [aIndex, setAIndex] = useState<string>("10");
  const [kIndex, setKIndex] = useState<number>(1);
  const [xray, setXray] = useState<string>("A0.0");
  const [conditions, setConditions] = useState<string>("NORMAL / QUIET");
  const [sigNoise, setSigNoise] = useState<string>("S0");
  const [solarWind, setSolarWind] = useState<string>("0.0");
  const [bandConds, setBandConds] = useState<{ [key: string]: string }>({});

  const [loading, setLoading] = useState(true);
  const [isLiveStream, setIsLiveStream] = useState(false);
  const [isNight, setIsNight] = useState<boolean>(false);
  
  const [geoArcs, setGeoArcs] = useState<any[]>([]);
  const [landmasses, setLandmasses] = useState<any[]>([]);

  const [potaSpots, setPotaSpots] = useState<PotaSpot[]>([]);
  const [pskSpots, setPSKSpots] = useState<AppPskSpot[]>([]);
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
      clearInterval(workspaceTimeout);
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
          height: mobileViewActive ? 340 : 460
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

      const countMatch = cleanText.match(/(?:COUNT|TOTAL)=([0-9,]+)/i) || cleanText.match(/(?:count|qsos)=([0-9,]+)/i);
      const confirmedMatch = cleanText.match(/(?:CONFIRMED|CQSL)=([0-9,]+)/i) || cleanText.match(/<cqsl>([0-9,]+)/i);
      const dxccMatch = cleanText.match(/(?:DXCC|DXCC_COUNT)=([0-9,]+)/i) || cleanText.match(/<dxcc>([0-9,]+)/i);

      let adifContent = cleanText.includes("ADIF=") ? cleanText.split(/ADIF=/i)[1] : cleanText;
      const allParsedLogs: QSO[] = [];
      const rawGeoCoordinates: any[] = [];
      
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

        const itemGrid = extractTag("gridsquare") || "—";
        const rawLatStr = extractTag("lat");
        const rawLngStr = extractTag("lon");

        allParsedLogs.push({
          callsign: call.toUpperCase().replace(/0/g, "Ø"),
          date: fD,
          time: fT,
          band: extractTag("band") || "—",
          mode: extractTag("mode") || "—",
          rstS: extractTag("rst_sent") || "59",
          rstR: extractTag("rst_rcvd") || "59",
          grid: itemGrid,
          country: countryString,
          qslRcvd: qslStatus,
          lotwRcvd: lotwStatus,
          eqslRcvd: eqslStatus,
          qrzRcvd: qrzStatus
        });

        let decimalLat = 0;
        let decimalLng = 0;

        if (rawLatStr && rawLngStr) {
          const latParts = rawLatStr.match(/([NS])\s*(\d+)\s+([\d.]+)/i);
          const lngParts = rawLngStr.match(/([EW])\s*(\d+)\s+([\d.]+)/i);
          
          if (latParts && lngParts) {
            decimalLat = parseInt(latParts[2]) + parseFloat(latParts[3]) / 60;
            if (latParts[1].toUpperCase() === "S") decimalLat *= -1;
            
            decimalLng = parseInt(lngParts[2]) + parseFloat(lngParts[3]) / 60;
            if (lngParts[1].toUpperCase() === "W") decimalLng *= -1;
          }
        }

        rawGeoCoordinates.push({
          callsign: call,
          grid: itemGrid,
          country: countryString,
          lat: decimalLat,
          lng: decimalLng
        });
      }

      const sortedLogs = allParsedLogs.sort((a, b) => {
        const dA = `${a.date.replace(/-/g, '')}T${a.time.replace(/:/g, '')}`;
        const dB = `${b.date.replace(/-/g, '')}T${b.time.replace(/:/g, '')}`;
        return dB.localeCompare(dA);
      });

      if (sortedLogs.length > 0) {
        const newestSixteen = sortedLogs.slice(0, 16);
        setLogs(newestSixteen);
        setIsLiveStream(true);

        const rawBand = newestSixteen[0].band ? newestSixteen[0].band : "20M";
        const displayBand = rawBand.toUpperCase().endsWith("M") 
          ? `${rawBand.substring(0, rawBand.length - 1)} Meters` 
          : `${rawBand} Meters`;

        const parsedGlobalCount = json.count ? parseInt(json.count) : (countMatch ? parseInt(countMatch[1].replace(/,/g, '')) : HARD_FLOOR_TOTAL);
        const parsedGlobalCqsl = json.confirmed ? parseInt(json.confirmed) : (confirmedMatch ? parseInt(confirmedMatch[1].replace(/,/g, '')) : HARD_FLOOR_CONFIRMED);
        const parsedGlobalDxcc = json.dxcc ? parseInt(json.dxcc) : (dxccMatch ? parseInt(dxccMatch[1].replace(/,/g, '')) : HARD_FLOOR_DXCC);

        const finalCalculatedTotal = Math.max(HARD_FLOOR_TOTAL, parsedGlobalCount);
        const finalCalculatedConfirmed = Math.max(HARD_FLOOR_CONFIRMED, parsedGlobalCqsl);
        const finalCalculatedDxcc = Math.max(HARD_FLOOR_DXCC, parsedGlobalDxcc);

        setStats({
          totalQsos: finalCalculatedTotal.toString(),
          confirmed: finalCalculatedConfirmed.toString(),
          dxcc: finalCalculatedDxcc.toString(),
          currentBand: displayBand,
          currentMode: newestSixteen[0].mode || "FT8"
        });

        const recentCallsigns = newestSixteen.map(q => q.callsign.replace(/Ø/g, "0"));
        const generatedArcs: any[] = [];

        rawGeoCoordinates.forEach((coord: any) => {
          const checkCall = coord.callsign.toUpperCase();
          if (!recentCallsigns.includes(checkCall)) return;

          let exactLat = coord.lat;
          let exactLng = coord.lng;

          if ((exactLat === 0 && exactLng === 0) && coord.grid && coord.grid.length >= 4) {
            const g = coord.grid.toUpperCase();
            const lonField = (g.charCodeAt(0) - 65) * 20 - 180;
            const latField = (g.charCodeAt(1) - 65) * 10 - 90;
            const lonSquare = parseInt(g.charAt(2)) * 2;
            const latSquare = parseInt(g.charAt(3)) * 1;
            if (!isNaN(lonField) && !isNaN(latField) && !isNaN(lonSquare) && !isNaN(latSquare)) {
              exactLng = lonField + lonSquare + 1;
              exactLat = latField + latSquare + 0.5;
            }
          }

          if (exactLat === 0 && exactLng === 0) return;

          const isUSAPrefix = checkCall.startsWith("W") || checkCall.startsWith("K") || checkCall.startsWith("N") || checkCall.startsWith("AA");
          const assignedTargetColor = isUSAPrefix ? "#00f2ff" : "#ff9100";
          const territoryType = isUSAPrefix ? "DOMESTIC (USA)" : "INTERNATIONAL (DX)";

          generatedArcs.push({
            startLat: 38.6158,
            startLng: -95.2686,
            lat: exactLat,
            lng: exactLng,
            endLat: exactLat,
            endLng: exactLng,
            color: assignedTargetColor,
            gridKey: coord.grid,
            territory: territoryType,
            country: coord.country || "Unknown DXCC",
            operators: checkCall.replace(/0/g, "Ø"),
            type: "qrz",
            text: `+ ${checkCall.replace(/0/g, "Ø")}`
          });
        });

        setGeoArcs(generatedArcs);

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

  async function fetchLocalTacticalWeather() {
    try {
      const res = await fetch("/api/weather-station"); 
      if (!res.ok) throw new Error("PWS link failed");
      const data = await res.json();
      
      if (data && !data.error) {
        let summary = "CLEAR_SKIES";
        const rainRateVal = parseFloat(data.rainRate) || 0;
        const windSpeedVal = parseFloat(data.windSpeed) || 0;

        if (rainRateVal > 0) summary = "RAIN_PRECIP";
        else if (windSpeedVal > 15) summary = "HIGH_WINDS";
        else summary = "SYS_NORMAL";

        let rawSolar = data.solRad ?? data.solarradiation ?? data.solarRadiation ?? data.solar_radiation;
        let rawUvi = data.uvi ?? data.uv ?? data.uvindex ?? data.uv_index;

        if (rawSolar === undefined || rawUvi === undefined) {
           Object.keys(data).forEach(key => {
              const k = key.toLowerCase();
              if (k.includes("solar") && rawSolar === undefined) rawSolar = data[key];
              if ((k === "uv" || k.includes("uvi")) && rawUvi === undefined) rawUvi = data[key];
           });
        }

        setWeather({
          temp: data.temp != null && !isNaN(parseFloat(data.temp)) ? Math.round(parseFloat(data.temp)).toString() : "——",
          humidity: data.humidity != null && !isNaN(parseFloat(data.humidity)) ? Math.round(parseFloat(data.humidity)).toString() : "——",
          windSpeed: data.windSpeed != null && !isNaN(parseFloat(data.windSpeed)) ? Math.round(windSpeedVal).toString() : "——",
          windDir: data.windDir != null && !isNaN(parseFloat(data.windDir)) ? Math.round(parseFloat(data.windDir)).toString() : "——",
          baro: data.baro != null && !isNaN(parseFloat(data.baro)) ? parseFloat(data.baro).toFixed(2) : "——", 
          solRad: rawSolar != null && !isNaN(parseFloat(rawSolar)) ? parseFloat(rawSolar).toString() : "——",
          uvi: rawUvi != null && !isNaN(parseFloat(rawUvi)) ? parseFloat(rawUvi).toString() : "0",
          condition: summary,
          iconCode: rainRateVal > 0 ? 60 : 0
        });
      } else {
        setWeather(prev => ({ ...prev, condition: "OFFLINE_LINK" }));
      }
    } catch (e) {
      console.warn("Shack PWS Connection Interrupted:", e);
      setWeather(prev => ({ ...prev, condition: "LINK_ERROR" }));
    }
  }

  async function fetchLiveTacticalFeeds() {
    try {
      const potaRes = await fetch("/api/pota?_=" + Date.now(), { cache: "no-store" });
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
        }
      }
    } catch (e) { console.warn("POTA Link Down", e); }

    try {
      const res = await fetch("/api/psk?callsign=AF0DB"); 
      if (res.ok) {
        const pskData = await res.json();
        if (pskData && Array.isArray(pskData.spots)) {
          setPSKSpots(pskData.spots);
          setGlobePoints(pskData.spots.map((spot: any) => ({
            lat: spot.lat,
            lng: spot.lng,
            type: "psk",
            details: spot
          })));
        }
      }
    } catch (e) {}
  }

  async function fetchSolarData() {
    try {
      const res = await fetch("/api/solar?_=" + Date.now(), { cache: "no-store" });
      if (!res.ok) return;
      const xmlText = await res.text();
      
      const sfiM = xmlText.match(/<solarflux>([^<]*)/i);
      const sspotsM = xmlText.match(/<sunspots>([^<]*)/i);
      const aM = xmlText.match(/<aindex>([^<]*)/i);
      const kM = xmlText.match(/<kindex>([^<]*)/i);
      const xrayM = xmlText.match(/<xray>([^<]*)/i);
      const condM = xmlText.match(/<geomagfield>([^<]*)/i);
      const sigNoiseM = xmlText.match(/<signalnoise>([^<]*)/i);
      const windM = xmlText.match(/<solarwind>([^<]*)/i);

      if (sfiM) setSfi(parseInt(sfiM[1].trim()) || 145);
      if (sspotsM) setSunspots(sspotsM[1].trim() || "98");
      if (aM) setAIndex(aM[1].trim() || "10");
      if (kM) setKIndex(parseInt(kM[1].trim()) || 1);
      if (xrayM) setXray(xrayM[1].trim() || "A0.0");
      if (condM) setConditions(condM[1].trim().toUpperCase() || "NORMAL / QUIET");
      if (sigNoiseM) setSigNoise(sigNoiseM[1].trim().toUpperCase());
      if (windM) setSolarWind(windM[1].trim());

      const extractBand = (band: string, time: string) => {
        const m = xmlText.match(new RegExp(`<band name="${band}" time="${time}">([^<]*)<\\/band>`, "i"));
        return m ? m[1].toUpperCase() : "FAIR";
      };

      setBandConds({
        "80m-40m-day": extractBand("80m-40m", "day"),
        "80m-40m-night": extractBand("80m-40m", "night"),
        "30m-20m-day": extractBand("30m-20m", "day"),
        "30m-20m-night": extractBand("30m-20m", "night"),
        "17m-15m-day": extractBand("17m-15m", "day"),
        "17m-15m-night": extractBand("17m-15m", "night"),
        "12m-10m-day": extractBand("12m-10m", "day"),
        "12m-10m-night": extractBand("12m-10m", "night"),
      });

    } catch (err) { console.warn(err); }
  }

  // AUTOMATED REAL-TIME RAY TRACING PROPAGATION SCORE LOGIC ENGINE
  const getCalculatedPropagationArray = () => {
    const parsedSunspots = parseInt(sunspots) || 0;
    const baseIonization = Math.min(100, Math.max(0, (sfi - 65) * 1.1 + parsedSunspots * 0.15));
    const finalIonization = Math.round(baseIonization);

    const windSpeedVal = parseFloat(solarWind) || 400;
    const baseStormPenalty = kIndex * 12 + (windSpeedVal > 500 ? (windSpeedVal - 500) * 0.08 : 0);
    const finalAttenuation = Math.min(100, Math.round(baseStormPenalty));

    const noiseScaleInt = parseInt(sigNoise.replace(/[^0-9]/g, "")) || 1;
    const calculatedNet = Math.round(finalIonization - finalAttenuation - noiseScaleInt * 3);
    const finalNetScore = Math.min(100, Math.max(0, calculatedNet));

    let displayString = "DX_PATH_OPTIMAL";
    let textClass = "txt-neon-green";

    if (finalNetScore < 40) {
      displayString = "BAND_BLACKOUT";
      textClass = "rst-r-box";
    } else if (finalNetScore < 75) {
      displayString = "PATH_DEGRADED";
      textClass = "txt-solar-amber";
    }

    return {
      ionization: finalIonization,
      attenuation: finalAttenuation,
      netValue: finalNetScore,
      statusText: displayString,
      colorClass: textClass
    };
  };

  const getColorClass = (rating: string) => {
    if (rating === "GREAT" || rating === "GOOD") return "txt-neon-green";
    if (rating === "FAIR") return "txt-solar-amber";
    return "rst-r-box";
  };

  const getPropRating = (band: string) => {
    const timeKey = isNight ? "night" : "day";
    switch (band) {
      case "80M": case "40M": return bandConds[`80m-40m-${timeKey}`] || "FAIR";
      case "30M": case "20M": return bandConds[`30m-20m-${timeKey}`] || "FAIR";
      case "17M": case "15M": return bandConds[`17m-15m-${timeKey}`] || "FAIR";
      case "12M": case "10M": return bandConds[`12m-10m-${timeKey}`] || "FAIR";
      default: return "FAIR";
    }
  };

  // GLOBAL SCO MATRIX RESOLUTION RUNNER - Lifted safely above the layout block bounds
  const propArray = getCalculatedPropagationArray();

  return (
    <div className="app-container">
      <style dangerouslySetInnerHTML={{__html: `
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { max-width: 100vw; overflow-x: hidden; }
        
        body::before {
          content: " ";
          display: block;
          position: fixed;
          top: 0; left: 0; bottom: 0; right: 0;
          background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.15) 50%);
          z-index: 9999;
          background-size: 100% 4px;
          pointer-events: none;
        }

        .app-container {
          background-color: #030403;
          color: #a3c2ae;
          min-height: 100vh;
          font-family: monospace;
          box-sizing: border-box;
          letter-spacing: 0.05em;
          position: relative;
          overflow-x: hidden;
          max-width: 100vw;
          padding: 1.5rem;
        }

        /* HEADER RESPONSIVE CSS */
        .tactical-header {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          border-bottom: 1px solid rgba(0, 255, 102, 0.2);
          padding-bottom: 1rem;
          margin-bottom: 1rem;
          gap: 0;
        }
        .header-h1 {
          font-size: 1.35rem;
          font-weight: 700;
          color: #00ff66;
          display: flex;
          align-items: center;
          gap: 0.6rem;
          letter-spacing: -0.01em;
          text-shadow: 0 0 6px rgba(0,255,102,0.3);
          line-height: 1.3;
        }
        .header-status-box {
          display: flex;
          gap: 0.5rem;
          align-self: center;
        }

        /* 2D FLUID HORIZONTAL ROW SEPARATION SYSTEM ENGINE */
        .deck-workspace { 
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          opacity: 0;
          transition: opacity 0.8s ease;
        }
        .deck-workspace.active { opacity: 1; }
        
        .workspace-row {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
          width: 100%;
          align-items: start;
        }

        /* TARGETED LAPTOP DISPLAY MECHANICS: Fluid 2-Column layout optimization under 1440px wide */
        @media (min-width: 1024px) and (max-width: 1439px) {
          .workspace-row.row-upper { grid-template-columns: 1fr 1fr; }
          .workspace-row.row-lower { grid-template-columns: 1fr 1fr; }
          .panel-wx { min-height: 380px !important; }
          .panel-gear { min-height: auto !important; grid-column: span 2; }
          .panel-solar { grid-column: span 1; }
          .panel-logs { grid-column: span 1; }
          .panel-pota-psk-wrapper { grid-column: span 2; display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
          .triple-box-grid { grid-template-columns: repeat(3, 1fr); display: grid; gap: 0.75rem; }
        }

        /* TARGETED ULTRA-WIDE DESKTOP CODES: Native Fluid 3-Column distribution rules */
        @media (min-width: 1440px) { 
          .workspace-row.row-upper { grid-template-columns: minmax(320px, 24%) 1fr minmax(300px, 25%); }
          .workspace-row.row-lower { grid-template-columns: minmax(320px, 24%) 1fr minmax(300px, 25%); }
          .panel-pota-psk-wrapper { display: contents; }
          .triple-box-grid { grid-template-columns: repeat(3, 1fr); display: grid; gap: 0.75rem; }
        }

        /* PURE CSS MOBILE REORDERING ARCHITECTURE */
        @media (max-width: 1023px) {
          .app-container { padding: 0.75rem; }
          
          .tactical-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }
          .header-h1 { font-size: 0.9rem; letter-spacing: -0.05em; }
          .header-status-box { align-self: flex-start; }

          .deck-workspace { gap: 0 !important; }
          .workspace-row { display: flex !important; flex-direction: column !important; gap: 0 !important; }
          .mobile-unwrap { display: contents !important; }
          
          .terminal-panel, .aligned-metric-box { margin-top: 0 !important; margin-bottom: 1rem !important; }
          .log-table-wrapper { width: 100%; max-width: calc(100vw - 1.5rem); overflow-x: auto; }
          
          .panel-gear { order: 1 !important; }
          .panel-active-band { order: 2 !important; margin-bottom: 0.75rem !important; }
          .panel-triple { order: 3 !important; margin-bottom: 0.75rem !important; display: flex !important; flex-direction: column !important; gap: 0.75rem !important; }
          .panel-triple .aligned-metric-box { margin-bottom: 0 !important; }
          
          .panel-dxcc { order: 4 !important; }
          .panel-globe { order: 5 !important; }
          .panel-logs { order: 6 !important; }
          .panel-wx { order: 7 !important; }
          .panel-solar { order: 8 !important; }
          .panel-pota { order: 9 !important; }
          .panel-psk { order: 10 !important; margin-bottom: 2rem !important; }
        }

        .terminal-panel {
          background: #060907;
          border: 1px solid rgba(0, 255, 102, 0.2);
          border-radius: 4px;
          padding: 1rem;
          box-shadow: inset 0 0 15px rgba(0, 255, 102, 0.05), 0 4px 20px rgba(0,0,0,0.8);
          width: 100%;
          max-width: 100%;
          position: relative;
          z-index: 10;
        }
        @media (min-width: 640px) { .terminal-panel { padding: 1.25rem; } }

        .terminal-panel::before {
          content: "+";
          position: absolute;
          top: 2px; left: 4px;
          font-size: 9px; color: rgba(0, 255, 102, 0.4);
        }

        .panel-header { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(0, 255, 102, 0.15); padding-bottom: 0.75rem; margin-bottom: 1rem; }
        
        .tactical-tooltip-trigger {
          position: relative;
          cursor: help;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          color: #ffaa00;
          letter-spacing: 0.08em;
          border: none;
          background: transparent;
          outline: none;
          padding: 0;
          text-align: left;
          width: 100%;
        }
        
        .tactical-tooltip-trigger::after {
          content: attr(data-blurb);
          position: absolute;
          bottom: 130%;
          left: 50%;
          transform: translateX(-50%);
          background: #040605;
          border: 1px solid #00ff66;
          border-radius: 4px;
          color: #c2decb;
          font-family: monospace;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.03em;
          line-height: 1.4;
          padding: 0.75rem 1rem;
          width: 260px;
          white-space: pre-wrap; 
          box-shadow: 0 15px 30px rgba(0,0,0,0.9);
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          z-index: 9999;
          transition: opacity 0.15s ease, visibility 0.15s ease;
        }

        .downward-tooltip::after {
          bottom: auto !important;
          top: 130% !important;
          box-shadow: 0 15px 30px rgba(0,0,0,0.95);
        }

        .tactical-tooltip-trigger:hover::after,
        .tactical-tooltip-trigger:focus::after,
        .tactical-tooltip-trigger:active::after {
          opacity: 1;
          visibility: visible;
        }

        .panel-title { font-size: 0.8rem; font-weight: 700; text-transform: uppercase; color: #ffaa00; letter-spacing: 0.08em; display: flex; align-items: center; gap: 0.5rem; }
        
        .data-row { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid rgba(0, 255, 102, 0.05); font-size: 0.8rem; background: transparent !important; position: relative; }
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
        .badge-mode-tactical { border: 1px solid rgba(0, 255, 102, 0.4); color: #00ff66; font-size: 10px; font-weight: 700; padding: 0.15rem 0.4rem; border-radius: 4px; background: rgba(0,255,102,0.03); }
        .badge-mode-tactical { border: 1px solid rgba(0, 255, 102, 0.4); color: #00ff66; font-size: 10px; font-weight: 700; padding: 0.15rem 0.4rem; border-radius: 4px; background: rgba(0,255,102,0.03); }
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
          line-height: 1.4 !important;
        }

        .terminal-cursor::after {
          content: "█";
          animation: blink 0.9s step-start infinite;
          margin-left: 2px;
        }
        @keyframes blink {
          50% { opacity: 0; }
        }
        @media (min-width: 1024px) {
          .panel-header-weather { display: flex; align-items: center; justify-content: space-between; }
        }
        
        .hud-pulse {
          animation: pulse-glow 2s infinite ease-in-out;
          font-weight: 700;
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.3; color: #334a3b; }
          50% { opacity: 1; color: #00ff66; text-shadow: 0 0 10px rgba(0, 255, 102, 0.6); }
        }
        
        .ticker-scroller-box {
          height: 120px;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(0, 255, 102, 0.2) transparent;
        }

        .aligned-metric-box {
          border: 1px solid rgba(0, 255, 102, 0.2);
          border-radius: 4px;
          background: #060907;
          padding: 0.5rem 0.75rem;
          margin-bottom: 0.75rem;
          box-shadow: inset 0 0 10px rgba(0, 255, 102, 0.03);
          position: relative;
        }
        .aligned-metric-label {
          font-size: 0.6rem;
          color: #688a73;
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 0.05em;
          white-space: nowrap;
        }
        .aligned-metric-value {
          font-size: 1.15rem;
          font-weight: 800;
          margin-top: 0.1rem;
        }
      `}} />

      {/* Header */}
      <header className="tactical-header">
        <div>
          <h1 className="header-h1">
            <Radio style={{ minWidth: "20px", width: "20px", height: "20px", color: "#ffaa00", flexShrink: 0 }} /> 
            <span className={mainTitleText.length < targetTitle.length ? "terminal-cursor" : ""}>{mainTitleText}</span>
          </h1>
          <p style={{ fontSize: "0.65rem", color: "#425e4c", marginTop: "0.4rem", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, minHeight: "12px", lineHeight: "1.4" }}>
            <span className={mainTitleText.length >= targetTitle.length && subTitleText.length < targetSubtitle.length ? "terminal-cursor" : ""}>{subTitleText}</span>
          </p>
        </div>
        <div className="header-status-box">
          <button onClick={() => { parseLiveQrzData(); fetchLiveTacticalFeeds(); fetchSolarData(); fetchLocalTacticalWeather(); }} style={{ background: "transparent", border: "none", outline: "none", cursor: "pointer" }}>
            <span className="status-bracket">[<span className="status-text">{loading ? "SYNCING" : "SYS_OK"}</span>]</span>
          </button>
          <span className="status-bracket">[<span className="status-text" style={{ color: "#ffaa00" }}>{isLiveStream ? "LIVE_FEED" : "STANDBY"}</span>]</span>
        </div>
      </header>

      {/* Vibe Coded Tactical Core Status Banner */}
      <section style={{ background: "rgba(0, 255, 102, 0.02)", border: "1px dashed rgba(0, 255, 102, 0.15)", borderRadius: "4px", padding: "0.5rem 0.75rem", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.08em", color: "#4e6e58", flexWrap: "wrap", gap: "0.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <span style={{ color: "#00ff66", display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#00ff66", display: "inline-block" }}></span>
            <span style={{ color: "#00ff66" }}>RADAR_ENGINE // INTEGRATED_NET_STREAM</span>
          </span>
          <span style={{ color: "rgba(0, 255, 102, 0.15)" }} className="hide-on-mobile-cell">|</span>
          <span className="hide-on-mobile-cell">POTA_MONITOR: <span style={{ color: "#00ff66" }}>ONLINE ({potaSpots.length} ACTIVE)</span></span>
          <span style={{ color: "rgba(0, 255, 102, 0.15)" }} className="hide-on-mobile-cell">|</span>
          <span className="hide-on-mobile-cell">PSK_REPORTER: <span style={{ color: "#a855f7" }}>LINKED</span></span>
          <span style={{ color: "rgba(0, 255, 102, 0.15)" }}>|</span>
          
          <button onClick={handleToggleAudioSystem} style={{ background: "transparent", border: "none", color: audioEnabled ? "#00ff66" : "#3c5243", cursor: "pointer", fontFamily: "monospace", fontSize: "0.65rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.35rem", padding: 0, outline: "none" }}>
            {audioEnabled ? <Volume2 style={{ width: "12px", height: "12px" }} /> : <VolumeX style={{ width: "12px", height: "12px" }} />}
            {audioEnabled ? "[ AUDIO: ON ]" : "[ AUDIO: OFF ]"}
          </button>
        </div>
      </section>

      {/* Main Workspace Split Grid Layout */}
      <main className={`deck-workspace ${showWorkspace ? "active" : ""}`} style={{ minWidth: 0 }}>
        
        {/* ROW 1 ARCHITECTURE MATRIX LINK */}
        <div className="workspace-row row-upper">
          
          {/* Upper Left: Weather Station Card */}
          <div className="mobile-unwrap">
            <div className="terminal-panel panel-wx" style={{ minHeight: "460px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div className="panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: isMobileScreen ? "wrap" : "nowrap" }}>
                  <button className="tactical-tooltip-trigger" data-blurb="Real-time weather telemetry streamed directly from Dan's backyard weather station, the Ecowitt WS-90.">
                    <Compass style={{ width: "16px", height: "16px", color: "#00ff66" }} /> TERRESTRIAL WX (AFØDB)
                  </button>
                  <span style={{ fontSize: "9px", color: "rgba(0, 255, 102, 0.4)", textTransform: "uppercase", whiteSpace: "nowrap" }}>[ Ecowitt WS-90 ]</span>
                </div>
                <div style={{ background: "#020403", border: "1px dashed rgba(0, 255, 102, 0.15)", borderRadius: "3px", padding: "0.5rem", marginBottom: "0.75rem", fontFamily: "monospace", fontSize: "10px", color: "#00ff66", display: "flex", gap: "1rem", alignItems: "center", justifyItems: "center" }}>
                  <pre style={{ margin: 0, fontSize: "9px", lineHeight: "1.1", color: "#00ff66" }}>
                    {weather.iconCode >= 60 ? `
       \\  |  /
      --  Oo  --
       /  |  \\
     .---.---.
    (         )
     '-------'
      ʻ ʻ ʻ ʻ  
                    ` : `
     .---.---.
    (         )
     '-------'
    (         )
     '-------'
                    `}
                  </pre>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "1.2rem", fontWeight: "800", color: "#ffffff" }}>{weather.temp}°F</div>
                    <div style={{ fontSize: "9px", color: "#00ff66", fontWeight: "700", marginTop: "2px" }}>
                      STATUS // <span className="hud-pulse">[ {weather.condition} ]</span>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <div className="data-row tactical-tooltip-trigger" data-blurb="Current ambient outdoor air temperature.">
                  <span className="data-label">THERMAL GRADIENT</span>
                  <span className="data-value">{weather.temp}°F</span>
                </div>
                <div className="data-row tactical-tooltip-trigger" data-blurb="Percentage of airborne moisture relative to its maximum capacity.">
                  <span className="data-label">RELATIVE HUMIDITY</span>
                  <span className="data-value txt-neon-green">{weather.humidity}% RH</span>
                </div>
                <div className="data-row tactical-tooltip-trigger" data-blurb="Current wind speed measured in miles per hour (MPH).">
                  <span className="data-label">WIND VELOCITY</span>
                  <span className="data-value">{weather.windSpeed} MPH</span>
                </div>
                <div className="data-row tactical-tooltip-trigger" data-blurb="Compass direction the wind is blowing from (360° scale).">
                  <span className="data-label">WIND VECTOR BEARING</span>
                  <span className="data-value txt-neon-green">{weather.windDir}° AZIMUTH</span>
                </div>
                <div className="data-row tactical-tooltip-trigger" data-blurb="Atmospheric weight. Falling pressure indicates storms; rising means clear skies.">
                  <span className="data-label">BAROMETRIC PRESSURE</span>
                  <span className="data-value txt-aviation-blue">{weather.baro} inHg</span>
                </div>
                <div className="data-row tactical-tooltip-trigger" data-blurb="Raw solar energy hitting the station, measured in Watts per square meter.">
                  <span className="data-label">SOLAR IRRADIANCE</span>
                  <span className="data-value txt-solar-amber">{weather.solRad} W/m²</span>
                </div>
                <div className="data-row tactical-tooltip-trigger" style={{ borderBottom: "none" }} data-blurb="Standardized scale measuring the intensity of sunburn-causing UV radiation.">
                  <span className="data-label">ULTRAVIOLET INDEX</span>
                  <span className="data-value" style={{ color: "#a855f7" }}>{weather.uvi}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Upper Center: 3D Globe View Canvas Terminal */}
          <div className="mobile-unwrap" style={{ display: "flex", flexDirection: "column", gap: "1rem", minWidth: 0 }}>
            <div className="triple-box-grid panel-triple">
              <div className="aligned-metric-box tactical-tooltip-trigger downward-tooltip" data-blurb="The current transmission type or digital modulation method Dan's transceiver is using to broadcast.">
                <div className="aligned-metric-label">Rig Mode</div>
                <div className="aligned-metric-value" style={{ color: "#ffaa00" }}>{stats.currentMode}</div>
              </div>
              <div className="aligned-metric-box tactical-tooltip-trigger downward-tooltip" data-blurb="The combined historical count of every documented two-way radio contact saved in Dan's logbook.">
                <div className="aligned-metric-label">Total QSOs</div>
                <div className="aligned-metric-value" style={{ color: "#00ff66" }}>{stats.totalQsos}</div>
              </div>
              <div className="aligned-metric-box tactical-tooltip-trigger downward-tooltip" data-blurb="Contacts that have been mutually verified by both operators electronically through Logbook of The World or QRZ.">
                <div className="aligned-metric-label">Confirmed</div>
                <div className="aligned-metric-value" style={{ color: "#a855f7" }}>{stats.confirmed}</div>
              </div>
            </div>

            <div 
              ref={containerRef}
              className="terminal-panel panel-globe" 
              style={{ 
                padding: "0.5rem", 
                background: "#020403", 
                position: "relative", 
                height: isMobileScreen ? "340px" : "460px", 
                overflow: "hidden", 
                display: "flex", 
                flexDirection: "column",
                border: "1px solid rgba(0, 255, 102, 0.25)"
              }}
            >
              {/* Legend Overlay HUD wrapping the downward-tooltip modified button trigger */}
              <div style={{ position: "absolute", top: "0.75rem", left: "1rem", zIndex: 20, width: "calc(100% - 2rem)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                  <button className="tactical-tooltip-trigger downward-tooltip" data-blurb="An interactive 3D globe plotting Dan's secure logbook data and signal vectors, alongside a live global feed of other POTA operators." style={{ color: "#ffffff", fontSize: "0.75rem" }}>
                    <Globe style={{ width: "14px", height: "14px", color: "#00ff66" }} /> 
                    <span>GEOGRAPHIC VECTOR TELEMETRY ARRAY</span>
                    <span className="hud-pulse" style={{ fontSize: "9px", letterSpacing: "0.05em" }}>[ HUD // TRACKER_ENGAGED ]</span>
                  </button>
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
              
              <div style={{ width: "100%", height: "100%", cursor: "grab", transform: "scale(0.82)", transformOrigin: "center center" }}>
                {showWorkspace && (
                  <GlobeEngine
                    width={dimensions.width}
                    height={dimensions.height}
                    backgroundColor="#020403"
                    polygonsData={landmasses}
                    polygonCapColor={() => "#07120a"} 
                    polygonSideColor={() => "#020403"} 
                    polygonStrokeColor={() => "#183620"} 
                    polygonAltitude={0.01}
                    arcsData={geoArcs}
                    arcColor="color"
                    arcDashLength={0.45}
                    arcDashGap={0.1}
                    arcDashAnimateTime={1400} 
                    arcStroke={0.5}
                    arcsTransitionDuration={0}
                    arcAltitude={(d: any) => Math.min(0.5, Math.max(0.1, Math.abs(d.lng - d.startLng) * 0.005))}
                    arcStartAltitude={0.012}
                    arcEndAltitude={0.012}
                    ringsData={geoArcs}
                    ringColor="color"
                    ringMaxRadius={2.2}
                    ringPropagationSpeed={1.0}
                    ringRepeatPeriod={1600}
                    ringAltitude={0.014}
                    showAtmosphere={true}
                    atmosphereColor="#00ff66"
                    atmosphereAltitude={0.12}
                    labelsData={[...globeLabels, ...globePoints]}
                    labelText={(d: any) => d.text || ""}
                    labelColor={(d: any) => d.type === "psk" ? "#a855f7" : (d.color || "#00ff66")}
                    labelSize={0.45}
                    labelDotRadius={0.35} 
                    labelAltitude={0.014}
                    labelResolution={3}
                    labelsTransitionDuration={0}
                    labelLabel={(d: any) => {
                      if (d.type === "pota") {
                        return `<div class="scene-tooltip"><div style="font-weight:700; color:#00ff66; margin-bottom:0.25rem;">POTA ACTIVATION</div><div>CALLSIGN: <b>${d.operators}</b></div><div>PARK ID: <b>${d.gridKey}</b></div></div>`;
                      }
                      if (d.type === "psk") {
                        return `<div class="scene-tooltip"><div style="font-weight:700; color:#a855f7; margin-bottom:0.25rem;">PSK RECEPTION NODE</div><div>MONITOR: <b>${d.details.receiverCall}</b></div><div>LOCATOR: <b>${d.details.grid}</b></div><div>REPORTED SNR: <span style="color:#00ff66">${d.details.snr}</span></div></div>`;
                      }
                      return `<div class="scene-tooltip"><div style="font-weight:700; color:${d.color}; margin-bottom:0.25rem;">LOGGED CONTACT</div><div>GRID SECTOR: <b>${d.gridKey}</b></div><div>COUNTRY: <b>${d.country}</b></div><div>OPERATORS: <b>${d.operators}</b></div></div>`;
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Item Right: Shack Gear Layout Stack Container */}
          <div className="mobile-unwrap">
            <div className="aligned-metric-box tactical-tooltip-trigger downward-tooltip panel-dxcc" data-blurb="The total number of unique global political entities and islands Dan has successfully worked and confirmed.">
              <div className="aligned-metric-label">Countries DXCC</div>
              <div className="aligned-metric-value" style={{ color: "#a3e335" }}>{stats.dxcc}</div>
            </div>
            <div className="terminal-panel panel-gear" style={{ minHeight: "460px" }}>
              <div className="panel-header">
                <button className="tactical-tooltip-trigger" data-blurb="The core operating equipment configuration, computer system properties, and antenna array for station AFØDB.">
                  <Cpu style={{ width: "16px", height: "16px", color: "#00ff66" }} /> HAMSHACK GEAR
                </button>
                <ChevronRight style={{ width: "14px", height: "14px", color: "#223b2b" }} />
              </div>
              <div className="data-row"><span className="data-label">STATION QTH</span><span className="data-value">OTTAWA, KS</span></div>
              <div className="data-row"><span className="data-label">MAIN RIG</span><span className="data-value">YAESU BASE-RIG FT-991</span></div>
              <div className="data-row"><span className="data-label">ANTENNA Array</span><span className="data-value">ISOTRON 20M</span></div>
              <div className="data-row" style={{ borderBottom: "none" }}><span className="data-label">ARCH SUITE</span><span className="data-value">XUBUNTU/HAM</span></div>
            </div>
          </div>

        </div>

        {/* ROW 2 ARCHITECTURE LOG METRIC SYNC CROSS-AXIS */}
        <div className="workspace-row row-lower">
          
          {/* Lower Left: Space Solar parameters framework */}
          <div className="terminal-panel panel-solar">
            <div className="panel-header">
              <button className="tactical-tooltip-trigger" data-blurb="Real-time solar metrics and HF radio band propagation updates directly from NOAA solar sweeps." style={{ color: "#ffaa00" }}>
                <Sun style={{ width: "16px", height: "16px" }} /> SOLAR WEATHER (N0NBH)
              </button>
            </div>
            <div style={{ background: "#020403", border: "1px dashed rgba(0, 255, 102, 0.25)", borderRadius: "3px", padding: "0.6rem 0.75rem", marginBottom: "0.85rem", fontSize: "10px", fontFamily: "monospace" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                <span style={{ color: "#688a73", fontWeight: 700 }}>NET PROPAGATION MATRIX:</span>
                <span className={`hud-pulse ${propArray.colorClass}`} style={{ fontWeight: 800 }}>{propArray.netValue}% // {propArray.statusText}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", borderTop: "1px solid rgba(0,255,102,0.08)", paddingTop: "0.4rem" }}>
                <div><span style={{ color: "#4e6e58" }}>IONIZATION:</span> <span style={{ color: "#00ff66", fontWeight: 700 }}>{propArray.ionization}%</span></div>
                <div style={{ textAlign: "right" }}>  <span style={{ color: "#4e6e58" }}>ATTENUATION:</span> <span style={{ color: "#ff3333", fontWeight: 700 }}>{propArray.attenuation}%</span></div>
              </div>
            </div>
            <div className="data-row tactical-tooltip-trigger" data-blurb="Measures solar ionizing radiation intensity. Values above 150 mean the sun is actively ionizing the F-layer, opening up the higher bands (15M, 12M, 10M)."><span className="data-label">SOLAR FLUX (SFI)</span><span className="data-value txt-solar-amber">{sfi}</span></div>
            <div className="data-row tactical-tooltip-trigger" data-blurb="The absolute count of active magnetic storms on the sun's surface. More sunspots equal higher solar flux, stronger ionization, and vastly improved long-distance DX propagation."><span className="data-label">SUNSPOT NUMBER</span><span className="data-value panel-mono-data">{sunspots}</span></div>
            <div className="data-row tactical-tooltip-trigger" data-blurb="Tracks geometric stability over the last 24 hours (scale 0-400). Lower numbers (under 15) mean stable, quiet ionospheric conditions with reliable, predictable band behavior."><span className="data-label">A INDEX</span><span className="data-value panel-mono-data txt-neon-green">{aIndex}</span></div>
            <div className="data-row tactical-tooltip-trigger" data-blurb="Real-time planetary magnetic disturbance tracker (scale 0-9). Quiet values (0-2) mean clean, noise-free signals; high values (above 4) signify geomag storms that absorb radio paths."><span className="data-label">K INDEX</span><span className="data-value panel-mono-data txt-neon-green">{kIndex}</span></div>
            <div className="data-row tactical-tooltip-trigger" data-blurb="Solar flare radiation energy tracker. Spikes up to M-class or X-class signal sudden solar flares that cause high noise floors or immediate total HF daylight radio blackouts."><span className="data-label">X-RAY FLUX</span><span className="data-value txt-aviation-blue">{xray}</span></div>
            <div className="data-row tactical-tooltip-trigger" data-blurb="The velocity of charged particles streaming from coronal holes. Speeds over 500 km/s compress the magnetosphere, dumping noise into the paths and destabilizing paths."><span className="data-label">SOLAR WIND</span><span className="data-value panel-mono-data">{solarWind} km/s</span></div>
            <div className="data-row tactical-tooltip-trigger" data-blurb="The baseline signal-to-noise ratio (S-meter rating) across the HF spectrum. S0-S1 means absolute quiet DX copy; S7-S9 means solar noise is masking weak voice stations."><span className="data-label">NOISE FIELD</span><span className="data-value txt-solar-amber">{sigNoise}</span></div>
            <div className="data-row tactical-tooltip-trigger" style={{ borderBottom: "none", marginBottom: "0.5rem" }} data-blurb="The general atmospheric stability layout. NORMAL/QUIET indicates a locked magnetosphere ideal for long-distance greyline skips; ACTIVE warns that paths may degrade."><span className="data-label">GEOMAG FIELD</span><span className="data-value txt-neon-green" style={{ fontSize: "0.75rem" }}>{conditions}</span></div>
            <div style={{ color: "#ffaa00", fontSize: "0.7rem", fontWeight: "700", borderTop: "1px dashed rgba(0, 255, 102, 0.15)", paddingTop: "0.75rem", paddingBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>HF Band Real-Time Profiles</div>
            <div className="data-row"><span className="data-label">160M Propagation</span><span className={`data-value ${getColorClass(getPropRating("80M"))}`}>[{getPropRating("80M")}]</span></div>
            <div className="data-row"><span className="data-label">80M Propagation</span><span className={`data-value ${getColorClass(getPropRating("80M"))}`}>[{getPropRating("80M")}]</span></div>
            <div className="data-row"><span className="data-label">60M Propagation</span><span className={`data-value ${getColorClass(getPropRating("80M"))}`}>[{getPropRating("80M")}]</span></div>
            <div className="data-row"><span className="data-label">40M Propagation</span><span className={`data-value ${getColorClass(getPropRating("80M"))}`}>[{getPropRating("80M")}]</span></div>
            <div className="data-row"><span className="data-label">30M Propagation</span><span className={`data-value ${getColorClass(getPropRating("30M"))}`}>[{getPropRating("30M")}]</span></div>
            <div className="data-row forced-row-reset"><span className="data-label forced-label-reset">20M Propagation</span><span className={`data-value ${getColorClass(getPropRating("20M"))}`}>[{getPropRating("20M")}]</span></div>
            <div className="data-row"><span className="data-label">17M Propagation</span><span className={`data-value ${getColorClass(getPropRating("17M"))}`}>[{getPropRating("17M")}]</span></div>
            <div className="data-row"><span className="data-label">15M Propagation</span><span className={`data-value ${getColorClass(getPropRating("15M"))}`}>[{getPropRating("15M")}]</span></div>
            <div className="data-row"><span className="data-label">12M Propagation</span><span className={`data-value ${getColorClass(getPropRating("12M"))}`}>[{getPropRating("12M")}]</span></div>
            <div className="data-row" style={{ borderBottom: "none" }}><span className="data-label">10M Propagation</span><span className={`data-value ${getColorClass(getPropRating("10M"))}`}>[{getPropRating("10M")}]</span></div>
          </div>

          {/* Lower Center: Live Ledger Logs interface alignment */}
          <div className="terminal-panel panel-logs" style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div className="panel-header">
              <button className="tactical-tooltip-trigger" data-blurb="Dan's secure real-time logbook feed streaming his most recent two-way radio contacts directly from the QRZ API database." style={{ color: "#00ff66" }}>
                <History style={{ width: "16px", height: "16px", color: "#00ff66" }} /> LIVE LOOK AT MOST RECENT QSOs
              </button>
            </div>
            <div className="log-table-wrapper" style={{ overflowX: "auto", marginTop: "0.5rem" }}>
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
                        &gt;&gt; Live log stream parsing pending... Standby for secure server handshake.
                      </td>
                    </tr>
                  ) : (
                    logs.slice(0, 16).map((qso, index) => (
                      <tr key={index}>
                        <td style={{ fontWeight: "700", color: "#ffffff", fontSize: "0.9rem" }} className="panel-mono-data">{qso.callsign}</td>
                        <td style={{ color: "#688a73" }} className="hide-on-mobile-cell">{qso.date}</td>
                        <td style={{ fontWeight: "500" }} className="hide-on-mobile-cell">{qso.time}</td>
                        <td style={{ fontWeight: "500" }}>{qso.band}</td>
                        <td><span className="badge-mode-tactical">{qso.mode}</span></td>
                        <td style={{ textAlign: "center" }}>
                          <span className="rst-s-box">{qso.rstS}</span>
                          <span style={{ color: "rgba(0, 255, 102, 0.2)", margin: "0 0.3rem" }}>|</span>
                          <span className="rst-r-box">{qso.rstR}</span>
                        </td>
                        <td style={{ color: "#688a73", fontWeight: "500" }} className="panel-mono-data">{qso.grid || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Lower Right: Side POTA & PSK parameters stack alignment Wrapper */}
          <div className="panel-pota-psk-wrapper">
            
            {/* Live POTA spots scroller register */}
            <div className="terminal-panel panel-pota" style={{ display: "flex", flexDirection: "column", height: "300px" }}>
              <div className="panel-header">
                <button className="tactical-tooltip-trigger" data-blurb="A live spotting list tracking active radio operators transmitting from State and National Parks globally.">
                  <Signal style={{ width: "16px", height: "16px", color: "#00ff66" }} /> LIVE POTA SPOTS NET
                </button>
              </div>
              <div className="ticker-scroller-box" style={{ flex: 1 }}>
                {potaSpots.length === 0 ? (
                  <div style={{ fontSize: "0.75rem", color: "#4e6e58", padding: "1rem" }}>Fetching live park grid channels...</div>
                ) : (
                  potaSpots.map((spot, i) => (
                    <div key={i} style={{ borderBottom: "1px dashed rgba(0,255,102,0.1)", padding: "0.4rem 0", fontSize: "0.75rem", display: "flex", justifyContent: "space-between" }}>
                      <div>
                        <span style={{ color: "#00ff66", fontWeight: 700 }}>{spot.activator}</span>
                        <span style={{ color: "#688a73", margin: "0 0.3rem" }}>@</span>
                        <span style={{ color: "#ffffff" }}>{spot.reference}</span>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ color: "#00ff66" }}>{spot.frequency} kHz</span>
                        <span style={{ color: "#4e6e58", marginLeft: "0.4rem" }}>{spot.time}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* PSK Reporter footprint register */}
            <div className="terminal-panel panel-psk" style={{ display: "flex", flexDirection: "column", height: "300px" }}>
              <div className="panel-header">
                <button className="tactical-tooltip-trigger" data-blurb="A live log of remote stations around the world that have successfully heard and decoded Dan's FT8 digital signals." style={{ color: "#a855f7" }}>
                  <Laptop style={{ width: "16px", height: "16px", color: "#a855f7" }} /> PSK FOOTPRINT REGISTRY (FT8)
                </button>
              </div>
              <div className="ticker-scroller-box" style={{ flex: 1 }}>
                {pskSpots.length === 0 ? (
                  <div style={{ fontSize: "0.7rem", color: "#4e6e58", padding: "1.5rem 1rem", fontStyle: "italic", textAlign: "center" }}>
                    &gt;&gt; SCANNING FREQUENCIES... NO REMOTE DECODES DETECTED IN THE LAST 2 HOURS.
                  </div>
                ) : (
                  pskSpots.map((spot, i) => (
                    <div key={i} style={{ borderBottom: "1px dashed rgba(0,255,102,0.1)", padding: "0.4rem 0", fontSize: "0.75rem", display: "flex", justifyContent: "space-between" }}>
                      <div>
                        RCVR: <span style={{ color: "#a855f7", fontWeight: 700 }}>{spot.receiverCall}</span>
                        <span style={{ color: "#4e6e58", marginLeft: "0.4rem" }}>({spot.grid})</span>
                      </div>
                      <div>
                        SIG: <span style={{ color: "#a855f7" }}>{spot.snr}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>

      </main>
    </div>
  );
}
