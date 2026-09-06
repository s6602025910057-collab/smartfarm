"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LineChart } from "@/components/analytics/line-chart";
import { StatisticsTable } from "@/components/analytics/statistics-table";
import type { MockPoint } from "@/lib/mock/sensor-data";

type SecondaryMetric = { label: string; value: string };

export type AnalyticsConfig = {
  title: string;
  subtitle: string;
  icon: string;
  accent: string;
  unit: string;
  current: string;
  status: string;
  insight: string;
  source: string;
  series: MockPoint[];
  secondary: SecondaryMetric[];
  decimals?: number;
};

export function AnalyticsPage({ config }: { config: AnalyticsConfig }) {
  const [range, setRange] = useState("24h");
  const rangeOptions = ["1h", "6h", "24h", "7d"];
  const data = useMemo(() => {
    if (range === "1h") return config.series.slice(-2);
    if (range === "6h") return config.series.slice(-4);
    if (range === "24h") return config.series.slice(-9);
    return config.series;
  }, [config.series, range]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-7xl px-3 pb-24 pt-4 sm:px-5 sm:pt-6 lg:px-8">
        <header className="border-b border-line/80 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-line bg-surface text-accent">
                <img src={config.icon} alt="" className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent">SmartFarm analytics</p>
                <h1 className="mt-1 truncate text-xl font-semibold tracking-tight sm:text-2xl">{config.title}</h1>
                <p className="mt-1 text-xs text-muted sm:text-sm">{config.subtitle}</p>
              </div>
            </div>
            <span className="shrink-0 rounded-full border border-line bg-surface/80 px-2.5 py-1 text-[10px] font-medium text-muted">{config.source}</span>
          </div>
        </header>

        <section className="mt-4 grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-medium text-muted">
                    <span className="size-2 rounded-full" style={{ backgroundColor: config.accent }} />
                    Current value
                  </div>
                  <div className="mt-3 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">{config.current}</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
                    <span className="rounded-full px-2 py-1" style={{ backgroundColor: `${config.accent}14`, color: config.accent }}>{config.status}</span>
                    <span>Live view</span>
                  </div>
                </div>
                <span className="rounded-lg border border-line bg-muted/5 p-2 text-muted">
                  <img src={config.icon} alt="" className="size-5" />
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-line/70 bg-muted/5 px-3 py-3 text-xs leading-5 text-muted">
                <span className="font-medium text-foreground">Insight · </span>{config.insight}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><div className="text-xs font-medium text-muted">Quick statistics</div></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2.5">
                {config.secondary.map((metric) => (
                  <div key={metric.label} className="rounded-lg border border-line/70 bg-muted/5 p-3">
                    <div className="text-[10px] uppercase tracking-[0.08em] text-muted">{metric.label}</div>
                    <div className="mt-2 text-base font-semibold text-foreground">{metric.value}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <Card className="mt-3 sm:mt-4">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-xs font-medium text-muted">Trend</div>
                <h2 className="mt-1 text-sm font-semibold text-foreground">{config.title} over time</h2>
              </div>
              <div className="grid grid-cols-4 rounded-lg border border-line bg-muted/5 p-0.5">
                {rangeOptions.map((option) => (
                  <button key={option} type="button" onClick={() => setRange(option)} className={`rounded-md px-3 py-1.5 text-[10px] font-semibold transition ${range === option ? "bg-surface text-foreground" : "text-muted hover:text-foreground"}`}>{option}</button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <LineChart data={data} unit={config.unit} label={`${config.title} trend`} color={config.accent} />
          </CardContent>
        </Card>

        <Card className="mt-3 sm:mt-4">
          <CardHeader>
            <div>
              <div className="text-xs font-medium text-muted">Statistics</div>
              <h2 className="mt-1 text-sm font-semibold text-foreground">Historical summary</h2>
            </div>
          </CardHeader>
          <CardContent>
            <StatisticsTable data={config.series} unit={config.unit} decimals={config.decimals ?? 1} source={config.source} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
