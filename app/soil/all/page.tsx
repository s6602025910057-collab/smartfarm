import { AnalyticsPage, type AnalyticsConfig } from "@/components/analytics/analytics-page";
import { getLatestReadings, getReadings } from "@/lib/supabase/rest";
import { rawToMoisturePercent, soilField } from "@/lib/sensors/soil";
import type { Reading } from "@/types/readings";

export const dynamic = "force-dynamic";

function series(readings: Reading[]) {
  return [...readings].reverse().map((reading) => {
    const soil1 = rawToMoisturePercent(soilField("soil1")(reading));
    const soil2 = rawToMoisturePercent(soilField("soil2")(reading));
    const average = (soil1 + soil2) / 2;
    return {
      timestamp: reading.received_at,
      value: Number(average.toFixed(2)),
    };
  });
}

function currentStatus(value: number) {
  if (value < 35) return "Too dry";
  if (value > 80) return "High moisture";
  return "Normal";
}

export default async function SoilAllPage() {
  const readings = await getReadings({ hours: 168, limit: 200 });
  const latestRows = await getLatestReadings(1);
  const latest = latestRows[0] ?? readings[0];

  const soil1 = latest ? rawToMoisturePercent(soilField("soil1")(latest)) : 0;
  const soil2 = latest ? rawToMoisturePercent(soilField("soil2")(latest)) : 0;
  const average = (soil1 + soil2) / 2;

  const config: AnalyticsConfig = {
    title: "All Soil",
    subtitle: "Soil 1 · Soil 2 · Average moisture overview",
    icon: "/icons/soil.svg",
    accent: "#10b981",
    unit: "%",
    current: `${average.toFixed(1)}%`,
    status: currentStatus(average),
    insight:
      Math.abs(soil1 - soil2) >= 15
        ? "The two soil points are showing a noticeable moisture difference."
        : "Soil 1 and Soil 2 are currently within a similar moisture range.",
    source: "Supabase · public.readings",
    series: series(readings),
    secondary: [
      { label: "Soil 1", value: `${soil1.toFixed(1)}%` },
      { label: "Soil 2", value: `${soil2.toFixed(1)}%` },
      { label: "Average", value: `${average.toFixed(1)}%` },
      { label: "Samples", value: String(readings.length) },
    ],
    decimals: 1,
  };

  return <AnalyticsPage config={config} />;
}
