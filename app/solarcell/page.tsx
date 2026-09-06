import { AnalyticsPage, type AnalyticsConfig } from "@/components/analytics/analytics-page";
import { solarMock } from "@/lib/mock/sensor-data";

export const dynamic = "force-dynamic";

const config: AnalyticsConfig = {
  title: "Solar cell",
  subtitle: "Solar-cell power received from the field array · electrical power is shown in watts",
  icon: "/icons/solar.svg",
  accent: "#f59e0b",
  unit: " W",
  current: "612 W",
  status: "Mock data",
  insight: "This page is intentionally not using RSSI. Until a solar measurement channel is added to public.readings, the series below remains mock data for the future sensor integration.",
  source: solarMock.source,
  series: solarMock.series,
  secondary: solarMock.secondary,
  decimals: 0,
};

export default function SolarCellPage() {
  return <AnalyticsPage config={config} />;
}
