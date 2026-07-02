// Normal pediatric vital sign ranges by Broselow zone, used to drive PALS-mode
// vitals thresholds/colors, HR-driven rhythm classification, default vitals,
// and post-ROSC vitals. Teaching approximations for simulation use.

export const PEDIATRIC_VITALS = {
  grey:   { hrLow: 100, hrHigh: 180, svtThreshold: 220, sbpMin: 60, spo2Min: 94,
            defaultVitals: { hr: 140, sbp: 70,  dbp: 45, spo2: 98, etco2: 35, temp: 98.6 },
            postRosc:      { hr: 150, sbp: 65,  dbp: 40, spo2: 94, etco2: 35 } },
  pink:   { hrLow: 100, hrHigh: 160, svtThreshold: 220, sbpMin: 70, spo2Min: 94,
            defaultVitals: { hr: 130, sbp: 80,  dbp: 50, spo2: 98, etco2: 35, temp: 98.6 },
            postRosc:      { hr: 140, sbp: 75,  dbp: 45, spo2: 94, etco2: 35 } },
  red:    { hrLow: 100, hrHigh: 160, svtThreshold: 220, sbpMin: 70, spo2Min: 94,
            defaultVitals: { hr: 120, sbp: 85,  dbp: 55, spo2: 98, etco2: 35, temp: 98.6 },
            postRosc:      { hr: 130, sbp: 80,  dbp: 50, spo2: 94, etco2: 35 } },
  purple: { hrLow: 90,  hrHigh: 150, svtThreshold: 220, sbpMin: 70, spo2Min: 94,
            defaultVitals: { hr: 110, sbp: 90,  dbp: 55, spo2: 98, etco2: 36, temp: 98.6 },
            postRosc:      { hr: 120, sbp: 85,  dbp: 52, spo2: 94, etco2: 36 } },
  yellow: { hrLow: 80,  hrHigh: 140, svtThreshold: 200, sbpMin: 75, spo2Min: 94,
            defaultVitals: { hr: 100, sbp: 95,  dbp: 60, spo2: 98, etco2: 36, temp: 98.6 },
            postRosc:      { hr: 110, sbp: 90,  dbp: 56, spo2: 94, etco2: 36 } },
  white:  { hrLow: 75,  hrHigh: 120, svtThreshold: 200, sbpMin: 80, spo2Min: 94,
            defaultVitals: { hr: 95,  sbp: 98,  dbp: 62, spo2: 98, etco2: 37, temp: 98.6 },
            postRosc:      { hr: 105, sbp: 92,  dbp: 58, spo2: 94, etco2: 37 } },
  blue:   { hrLow: 70,  hrHigh: 115, svtThreshold: 180, sbpMin: 85, spo2Min: 94,
            defaultVitals: { hr: 90,  sbp: 100, dbp: 64, spo2: 98, etco2: 37, temp: 98.6 },
            postRosc:      { hr: 100, sbp: 95,  dbp: 60, spo2: 94, etco2: 37 } },
  orange: { hrLow: 65,  hrHigh: 110, svtThreshold: 180, sbpMin: 90, spo2Min: 94,
            defaultVitals: { hr: 85,  sbp: 105, dbp: 66, spo2: 98, etco2: 38, temp: 98.6 },
            postRosc:      { hr: 95,  sbp: 100, dbp: 62, spo2: 94, etco2: 38 } },
  green:  { hrLow: 60,  hrHigh: 100, svtThreshold: 180, sbpMin: 90, spo2Min: 94,
            defaultVitals: { hr: 80,  sbp: 110, dbp: 68, spo2: 98, etco2: 38, temp: 98.6 },
            postRosc:      { hr: 90,  sbp: 104, dbp: 64, spo2: 94, etco2: 38 } },
}

export function getPediatricVitals(zoneKey, defaultZone) {
  return PEDIATRIC_VITALS[zoneKey] || PEDIATRIC_VITALS[defaultZone] || PEDIATRIC_VITALS.yellow
}
