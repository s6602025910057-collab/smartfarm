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
  insight: "Activity is modeled as a time-varying insect acoustic index. Replace the mock series with microphone/AI classification output when the sensor pipeline is ready.",
  source: soundMock.source,
  series: soundMock.series,
  secondary: soundMock.secondary,
  decimals: 1,
};

export default function SoundPage() {
  return <AnalyticsPage config={config} />;
}
