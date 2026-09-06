import { AnalyticsPage, type AnalyticsConfig } from "@/components/analytics/analytics-page";
import { getLatestReadings, getReadings } from "@/lib/supabase/rest";
import { rawToMoisturePercent, soilField, soilLabel } from "@/lib/sensors/soil";
import type { Reading } from "@/types/readings";

export const dynamic = "force-dynamic";

const sensorMap = {
  "1": "soil1",
  "2": "soil2",
  avg: "avg",
} as const;

type SensorKey = keyof typeof sensorMap;

function toSeries(readings: Reading[], field: "soil1" | "soil2" | "avg") {
  const getRaw = soilField(field);
  return [...readings]
    .reverse()
    .map((reading) => ({
      timestamp: reading.received_at,
      value: Number(rawToMoisturePercent(getRaw(reading)).toFixed(2)),
    }));
}

function status(percent: number) {
  if (percent < 35) return "Too dry";
  if (percent > 80) return "High moisture";
  return "Normal";
}

export default async function SoilPage({ params }: { params: Promise<{ sensor: string }> }) {
  const { sensor } = await params;
  const key = sensor as SensorKey;
  const selected = sensorMap[key] ?? "avg";
  const readings = await getReadings({ hours: 168, limit: 200 });
  const latestRows = await getLatestReadings(1);
  const latest = latestRows[0] ?? readings[0];
  const raw = latest ? soilField(selected)(latest) : NaN;
  const current = Number.isFinite(raw) ? rawToMoisturePercent(raw) : 0;
  const series = toSeries(readings, selected);
  const secondary = [
    { label: "Raw ADC", value: latest ? String(raw) : "—" },
    { label: "Node", value: latest ? `#${String(latest.node_id).padStart(2, "0")}` : "—" },
  ];

  const config: AnalyticsConfig = {
    title: soilLabel(selected),
    subtitle: "Soil moisture from public.readings · moisture % is the primary metric",
    icon: "/icons/soil.svg",
    accent: "#10b981",
    unit: "%",
    current: `${current.toFixed(1)}%`,
    status: status(current),
    insight: current < 35 ? "Moisture is below the current working threshold." : current > 80 ? "Moisture is above the current working range." : "Moisture is inside the current working range.",
    source: "Supabase · public.readings",
    series,
    secondary,
    decimals: 1,
  };

  return <AnalyticsPage config={config} />;
}
