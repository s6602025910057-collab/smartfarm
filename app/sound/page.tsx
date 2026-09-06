import { AnalyticsPage, type AnalyticsConfig } from "@/components/analytics/analytics-page";
import { soundMock } from "@/lib/mock/sensor-data";

export const dynamic = "force-dynamic";

const config: AnalyticsConfig = {
  title: "Sound",
  subtitle: "Acoustic activity around the crop canopy · insect monitoring prototype",
  icon: "/icons/sound.svg",
  accent: "#a78bfa",
  unit: " %",
  current: "58%",
  status: "Mock data",
  insight: "Activity is modeled as a time-varying insect acoustic index. The acoustic profile below is a visual placeholder for future microphone and insect-classification data.",
  source: soundMock.source,
  series: soundMock.series,
  secondary: soundMock.secondary,
  decimals: 1,
  visual: "acoustic",
};

export default function SoundPage() {
  return <AnalyticsPage config={config} />;
}
