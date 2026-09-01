'use client';

import { useEffect, useState } from 'react';

// 1-to-10 Scoring Algorithm
const getBandScore = (bandGroup: 'high' | 'mid' | 'low', sfi: number, kIndex: number, aIndex: number, solarWind: number, isNight: boolean) => {
    let score = 5;

    if (bandGroup === 'high') { // 10m, 12m, 15m
        score = 5;
        if (sfi > 160) score += 3;
        else if (sfi > 130) score += 2;
        else if (sfi > 100) score += 1;
        else if (sfi < 80) score -= 2;
        
        if (kIndex >= 5) score -= 3;
        else if (kIndex >= 4) score -= 1;
        if (solarWind > 600) score -= 1;
    } 
    else if (bandGroup === 'mid') { // 17m, 20m
        score = 6;
        if (sfi > 110) score += 1;
        if (kIndex >= 6) score -= 4;
        else if (kIndex >= 4) score -= 1;
        if (solarWind > 600) score -= 1;
    } 
    else { // 40m, 80m, 160m
        score = isNight ? 7 : 4; // Night is naturally better for low bands
        if (kIndex <= 1 && isNight) score += 2; // Exceptional quiet night DX bonus
        if (kIndex >= 4) score -= 3;
        if (kIndex >= 6) score -= 5;
        if (aIndex > 20) score -= 1;
        if (solarWind > 500) score -= 1;
    }

    return Math.max(1, Math.min(10, Math.round(score)));
};

const getScoreColor = (score: number) => {
    if (score >= 8) return 'txt-neon-green';
    if (score >= 5) return 'txt-solar-amber';
    return 'rst-r-box';
};

const getScoreLabel = (score: number) => {
    if (score >= 9) return 'OPTIMAL';
    if (score >= 7) return 'GOOD';
    if (score >= 5) return 'FAIR';
    if (score >= 3) return 'POOR';
    return 'BLACKOUT';
};

export default function BandConditionDashboard({ sfi, kIndex, aIndex, solarWind, isNight }: { 
    sfi: number; kIndex: number; aIndex: number; solarWind: string | number; isNight: boolean 
}) {
    const [forecast, setForecast] = useState<any[]>([]);

    useEffect(() => {
        fetch('/api/forecast')
            .then(res => res.json())
            .then(data => setForecast(data))
            .catch(err => console.error("Forecast fetch failed", err));
    }, []);

    const windVal = parseFloat(String(solarWind)) || 400;
    const highScore = getBandScore('high', sfi, kIndex, aIndex, windVal, isNight);
    const midScore = getBandScore('mid', sfi, kIndex, aIndex, windVal, isNight);
    const lowScore = getBandScore('low', sfi, kIndex, aIndex, windVal, isNight);

    return (
        <div className="terminal-panel" style={{ marginTop: '1rem' }}>
            <div className="panel-header">
                <button className="tactical-tooltip-trigger" data-blurb="Calculated 1-10 Band Condition Index based on real-time SFI, K-Index, A-Index, and Solar Wind.">
                    <span>📡 BAND CONDITION MATRIX [1-10]</span>
                </button>
            </div>

            <div className="data-row forced-row-reset">
                <span className="data-label forced-label-reset">HIGH (10m-15m)</span>
                <span className={`data-value ${getScoreColor(highScore)}`}>{highScore}/10 // {getScoreLabel(highScore)}</span>
            </div>
            <div className="data-row forced-row-reset">
                <span className="data-label forced-label-reset">MID (17m-20m)</span>
                <span className={`data-value ${getScoreColor(midScore)}`}>{midScore}/10 // {getScoreLabel(midScore)}</span>
            </div>
            <div className="data-row forced-row-reset" style={{ borderBottom: '1px solid rgba(0, 255, 102, 0.2)', marginBottom: '1rem' }}>
                <span className="data-label forced-label-reset">LOW (40m-160m)</span>
                <span className={`data-value ${getScoreColor(lowScore)}`}>{lowScore}/10 // {getScoreLabel(lowScore)}</span>
            </div>

            <div className="panel-header" style={{ marginTop: '0.5rem' }}>
                <span className="tactical-tooltip-trigger" style={{ cursor: 'default' }}>
                    <span>📅 10-DAY PROPAGATION FORECAST</span>
                </span>
            </div>

            <div className="log-table-wrapper">
                <table className="matrix-table">
                    <thead>
                        <tr>
                            <th>DATE</th>
                            <th>SFI</th>
                            <th>HIGH</th>
                            <th>MID</th>
                            <th>LOW</th>
                        </tr>
                    </thead>
                    <tbody>
                        {forecast.length === 0 ? (
                            <tr><td colSpan={5} style={{ textAlign: 'center', padding: '1rem' }}>ACQUIRING SATELLITE DATA...</td></tr>
                        ) : (
                            forecast.map((day, idx) => {
                                // Estimate Kp from A-Index for forecast (A=10 ~ Kp2, A=30 ~ Kp4)
                                const estK = Math.min(7, Math.round(day.aIndex / 7)); 
                                const h = getBandScore('high', day.sfi, estK, day.aIndex, 400, isNight);
                                const m = getBandScore('mid', day.sfi, estK, day.aIndex, 400, isNight);
                                const l = getBandScore('low', day.sfi, estK, day.aIndex, 400, isNight);
                                
                                return (
                                    <tr key={idx}>
                                        <td>{day.date}</td>
                                        <td>{day.sfi}</td>
                                        <td className={getScoreColor(h)}>{h}</td>
                                        <td className={getScoreColor(m)}>{m}</td>
                                        <td className={getScoreColor(l)}>{l}</td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
