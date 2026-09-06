import { AnalyticsPage, type AnalyticsConfig } from "@/components/analytics/analytics-page";
import { rainMock } from "@/lib/mock/sensor-data";

export const dynamic = "force-dynamic";

const config: AnalyticsConfig = {
  title: "Rain",
  subtitle: "Optical rain gauge prototype · accumulation and rainfall intensity",
  icon: "/icons/rain.svg",
  accent: "#38bdf8",
  unit: " mm",
  current: "12.5 mm",
  status: "Mock data",
  insight: "The production sensor can later provide accumulated rainfall and instantaneous rain-rate values without changing this page structure.",
  source: rainMock.source,
  series: rainMock.series,
  secondary: rainMock.secondary,
  decimals: 2,
};

export default function RainPage() {
  return <AnalyticsPage config={config} />;
}
