export type MockPoint = { timestamp: string; value: number };

function seededSeries(seed: number, base: number, spread: number, count = 49): MockPoint[] {
  const now = Date.now();
  return Array.from({ length: count }, (_, index) => {
    const hoursAgo = (count - 1 - index) * 3;
    const t = now - hoursAgo * 60 * 60 * 1000;
    const wave = Math.sin(index * 0.63 + seed) * spread * 0.55;
    const wave2 = Math.cos(index * 0.19 + seed * 0.7) * spread * 0.3;
    const drift = ((index % 9) - 4) * spread * 0.025;
    return { timestamp: new Date(t).toISOString(), value: Number((base + wave + wave2 + drift).toFixed(2)) };
  });
}

export const soundMock = {
  source: "Mock data",
  series: seededSeries(1.7, 46, 16).map((p) => ({ ...p, value: Math.max(8, Math.min(92, p.value)) })),
  unit: "%",
  label: "Insect activity",
  secondary: [
    { label: "Sound level", value: "51 dB" },
    { label: "Peak frequency", value: "4.8 kHz" },
  ],
};

export const solarMock = {
  source: "Mock data",
  series: Array.from({ length: 25 }, (_, index) => {
    const now = Date.now();
    const hour = index;
    const daylight = Math.max(0, Math.sin(((hour - 6) / 12) * Math.PI));
    const noise = Math.sin(index * 1.43) * 28;
    return {
      timestamp: new Date(now - (24 - index) * 60 * 60 * 1000).toISOString(),
      value: Number(Math.max(0, 720 * daylight + noise).toFixed(0)),
    };
  }),
  unit: " W",
  label: "Solar cell power",
  secondary: [
    { label: "Peak power", value: "718 W" },
    { label: "Daily energy", value: "4.62 kWh" },
  ],
};

export const rainMock = {
  source: "Mock data",
  series: seededSeries(4.2, 3.2, 4.4).map((p, index) => ({
    ...p,
    value: Number(Math.max(0, p.value + (index % 13 === 0 ? 11 : 0)).toFixed(2)),
  })),
  unit: " mm",
  label: "Rainfall accumulation",
  secondary: [
    { label: "Accumulated", value: "86.4 mm" },
    { label: "Rain rate", value: "12.5 mm/h" },
  ],
};

export const mockPlantEnvironment = {
  water: 0.68,
  light: 0.76,
};
