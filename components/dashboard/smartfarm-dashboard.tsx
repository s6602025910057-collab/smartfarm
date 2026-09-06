"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { Reading, ReadingRange } from "@/types/readings";

type DashboardProps = { initialReadings: Reading[] };

const ranges: { label: string; value: ReadingRange }[] = [
  { label: "1h", value: 1 },
  { label: "6h", value: 6 },
  { label: "24h", value: 24 },
  { label: "7d", value: 168 },
];

function formatTime(value?: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

function formatAge(value?: string) {
  if (!value) return "No data";
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function isOnline(value?: string) {
  if (!value) return false;
  return Date.now() - new Date(value).getTime() <= 10 * 60 * 1000;
}

function buildPoints(readings: Reading[]) {
  const sorted = [...readings].sort(
    (a, b) => new Date(a.received_at).getTime() - new Date(b.received_at).getTime(),
  );
  if (sorted.length <= 1) return sorted.map(() => ({ x: 50, y: 50 }));

  const values = sorted.map((item) => Number(item.avg_raw) || 0);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = max - min || 1;

  return sorted.map((item, index) => ({
    x: (index / (sorted.length - 1)) * 100,
    y: 90 - ((Number(item.avg_raw) - min) / spread) * 72,
  }));
}

function TrendChart({ readings }: { readings: Reading[] }) {
  const points = buildPoints(readings);
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const area = points.length
    ? `0,100 ${line} 100,100`
    : "0,100 100,100";

  return (
    <div className="relative h-44 w-full overflow-hidden rounded-lg bg-slate-950/55 px-2 pt-3">
      <div className="pointer-events-none absolute inset-x-2 top-8 border-t border-slate-800" />
      <div className="pointer-events-none absolute inset-x-2 top-1/2 border-t border-slate-800" />
      <div className="pointer-events-none absolute inset-x-2 bottom-7 border-t border-slate-800" />

      {readings.length > 0 ? (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-x-2 top-2 h-32 w-[calc(100%-1rem)]">
          <polyline points={area} fill="rgba(16,185,129,0.09)" stroke="none" />
          <polyline points={line} fill="none" stroke="#10b981" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        </svg>
      ) : (
        <div className="flex h-32 items-center justify-center text-xs text-slate-500">No readings in this range</div>
      )}

      <div className="absolute inset-x-2 bottom-2 flex justify-between text-[10px] text-slate-500">
        <span>Start</span>
        <span>{readings.length} samples</span>
        <span>Now</span>
      </div>
    </div>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/55 p-3.5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</span>
        <span className="size-1.5 rounded-full bg-slate-700" />
      </div>
      <div className="mt-4 min-w-0 truncate text-base font-semibold text-slate-100">{value}</div>
      <div className="mt-1 text-[11px] leading-4 text-slate-500">{detail}</div>
    </div>
  );
}

export function SmartFarmDashboard({ initialReadings }: DashboardProps) {
  const initialNode = initialReadings[0]?.node_id ?? 1;
  const [nodeId, setNodeId] = useState(initialNode);
  const [range, setRange] = useState<ReadingRange>(24);
  const [readings, setReadings] = useState<Reading[]>(initialReadings);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const nodes = useMemo(
    () => [...new Set(initialReadings.map((item) => item.node_id))].sort((a, b) => a - b),
    [initialReadings],
  );

  const latest = readings[0];
  const online = isOnline(latest?.received_at);
  const avg = latest ? Number(latest.avg_raw).toFixed(1) : "—";
  const lastUpdate = formatAge(latest?.received_at);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/readings?nodeId=${nodeId}&hours=${range}&limit=100`, {
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Unable to load readings");
        const data = (await response.json()) as Reading[];
        if (!cancelled) setReadings(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load readings");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [nodeId, range]);

  return (
    <main className="min-h-screen bg-[#020617] text-slate-100">
      <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-4 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-slate-800/80 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-400">SmartFarm</p>
            <h1 className="mt-1 text-lg font-semibold tracking-tight text-white sm:text-xl">Field monitoring</h1>
            <p className="mt-1 text-xs text-slate-500">Live sensor data from Supabase</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 rounded-md border border-slate-800 bg-slate-900/70 px-2.5 py-1.5 text-[11px] text-slate-400">
              Node
              <select
                value={nodeId}
                onChange={(event) => setNodeId(Number(event.target.value))}
                className="bg-transparent font-semibold text-slate-200 outline-none"
              >
                {nodes.length ? nodes.map((node) => <option key={node} value={node}>#{String(node).padStart(2, "0")}</option>) : <option value={1}>#01</option>}
              </select>
            </label>
            <Badge tone={online ? "success" : "warning"}>{online ? "Online" : "Offline"}</Badge>
          </div>
        </header>

        <section className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-slate-400">Soil signal</p>
                <div className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">{avg}</div>
                <p className="mt-1 text-xs text-slate-500">Average raw ADC · latest sample</p>
              </div>
              <div className="text-right text-[10px] text-slate-500">
                <div>{latest ? `Node ${String(latest.node_id).padStart(2, "0")}` : "No node"}</div>
                <div className="mt-1">{lastUpdate}</div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                <Metric label="Soil 1" value={latest ? String(latest.soil1_raw) : "—"} detail="Raw ADC" />
                <Metric label="Soil 2" value={latest ? String(latest.soil2_raw) : "—"} detail="Raw ADC" />
                <Metric label="RSSI" value={latest ? `${latest.rssi_dbm} dBm` : "—"} detail="LoRa signal" />
                <Metric label="SNR" value={latest ? `${latest.snr_db} dB` : "—"} detail="Link quality" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-slate-400">Latest sample</p>
                  <h2 className="mt-1 text-sm font-semibold text-white">Node health</h2>
                </div>
                <Badge tone={online ? "success" : "warning"}>{online ? "Healthy" : "Stale"}</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3"><span className="text-slate-500">Received</span><span className="font-medium text-slate-200">{formatTime(latest?.received_at)}</span></div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3"><span className="text-slate-500">Packets</span><span className="font-medium text-slate-200">{latest?.packet_count ?? "—"}</span></div>
                <div className="flex items-center justify-between"><span className="text-slate-500">Samples in view</span><span className="font-medium text-slate-200">{readings.length}</span></div>
              </div>
            </CardContent>
          </Card>
        </section>

        <Card className="mt-4">
          <CardHeader className="pb-1">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400">Trend</p>
                <h2 className="mt-1 text-sm font-semibold text-white">Average soil signal</h2>
              </div>
              <div className="flex rounded-md border border-slate-800 bg-slate-950/40 p-0.5">
                {ranges.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setRange(item.value)}
                    className={`rounded px-2.5 py-1 text-[10px] font-semibold transition ${range === item.value ? "bg-slate-800 text-white" : "text-slate-500 hover:text-slate-300"}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {error ? <p className="mb-3 text-xs text-amber-400">{error}</p> : null}
            <div className={loading ? "opacity-60 transition" : "transition"}>
              <TrendChart readings={readings} />
            </div>
            <div className="mt-3 flex flex-wrap justify-between gap-2 text-[10px] text-slate-500">
              <span>Source: public.readings</span>
              <span>Updated {lastUpdate}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
