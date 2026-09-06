"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PlantHealthVisual } from "@/components/dashboard/plant-health-visual";
import type { Reading, ReadingRange } from "@/types/readings";

type DashboardProps = { initialReadings: Reading[] };

type RangeOption = { label: string; value: ReadingRange };

const ranges: RangeOption[] = [
  { label: "1h", value: 1 },
  { label: "6h", value: 6 },
  { label: "24h", value: 24 },
  { label: "7d", value: 168 },
];

const icons = {
  soil: "https://www.figma.com/api/mcp/asset/f55c5330-1df9-4744-b64d-dece934fdfba.svg",
  light: "https://www.figma.com/api/mcp/asset/3709c015-6d61-4868-883e-73b347402f5e.svg",
  water: "https://www.figma.com/api/mcp/asset/4f30ae78-2a7e-4b84-94de-4dc2784bd857.svg",
  rain: "https://www.figma.com/api/mcp/asset/2e5b1317-7cf2-4784-8da3-ceca4c6c28da.svg",
};

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
    y: 88 - ((Number(item.avg_raw) - min) / spread) * 68,
  }));
}

function TrendChart({ readings }: { readings: Reading[] }) {
  const points = buildPoints(readings);
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const area = points.length ? `0,100 ${line} 100,100` : "0,100 100,100";

  return (
    <div className="relative h-52 w-full overflow-hidden rounded-md border border-slate-800/80 bg-slate-950/50 px-2 pt-4 sm:h-56">
      <div className="pointer-events-none absolute inset-x-2 top-[24%] border-t border-slate-800/80" />
      <div className="pointer-events-none absolute inset-x-2 top-1/2 border-t border-slate-800/80" />
      <div className="pointer-events-none absolute inset-x-2 top-[76%] border-t border-slate-800/80" />

      {readings.length > 0 ? (
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-x-2 top-3 h-40 w-[calc(100%-1rem)] sm:h-44"
          aria-hidden="true"
        >
          <polyline points={area} fill="rgba(16,185,129,0.08)" stroke="none" />
          <polyline
            points={line}
            fill="none"
            stroke="#10b981"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
          {points.map((point, index) => (
            <circle
              key={`${point.x}-${index}`}
              cx={point.x}
              cy={point.y}
              r="1.15"
              fill="#10b981"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
      ) : (
        <div className="flex h-40 items-center justify-center px-4 text-center text-xs text-slate-500 sm:h-44">
          No readings in this time window
        </div>
      )}

      <div className="absolute inset-x-2 bottom-3 flex justify-between text-[10px] text-slate-500">
        <span>Start</span>
        <span>{readings.length} samples</span>
        <span>Now</span>
      </div>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  detail,
}: {
  icon: string;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="group rounded-lg border border-slate-800 bg-slate-900/60 p-3.5 transition-colors hover:border-slate-700 hover:bg-slate-900">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
          <span className="grid size-5 place-items-center rounded-md bg-slate-950/70 ring-1 ring-inset ring-slate-800">
            <img src={icon} alt="" className="size-3.5" />
          </span>
          {label}
        </span>
        <span className="size-1.5 rounded-full bg-slate-700 transition-colors group-hover:bg-emerald-400" />
      </div>
      <div className="mt-3 min-w-0 truncate text-[15px] font-semibold text-slate-100 sm:text-base">{value}</div>
      <div className="mt-1 text-[11px] leading-4 text-slate-500">{detail}</div>
    </div>
  );
}

export function SmartFarmDashboard({ initialReadings }: DashboardProps) {
  const [nodeId, setNodeId] = useState(() =>
    initialReadings.some((reading) => reading.node_id === 1)
      ? 1
      : initialReadings[0]?.node_id ?? 1,
  );
  const [range, setRange] = useState<ReadingRange>(168);
  const [readings, setReadings] = useState<Reading[]>(initialReadings);
  const [latestReading, setLatestReading] = useState<Reading | undefined>(initialReadings[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const nodes = useMemo(
    () => [...new Set(initialReadings.map((item) => item.node_id))].sort((a, b) => a - b),
    [initialReadings],
  );

  const latest = latestReading;
  const online = isOnline(latest?.received_at);
  const avg = latest ? Number(latest.avg_raw).toFixed(1) : "—";
  const lastUpdate = formatAge(latest?.received_at);

  useEffect(() => {
    let cancelled = false;

    async function loadTrend() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/readings?nodeId=${nodeId}&hours=${range}&limit=100`, {
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Unable to load readings");
        const data = (await response.json()) as Reading[];
        if (!cancelled) {
          setReadings(data);
          if (data[0]) setLatestReading(data[0]);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load readings");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadTrend();
    return () => {
      cancelled = true;
    };
  }, [nodeId, range]);

  useEffect(() => {
    let cancelled = false;

    async function refreshLatest() {
      try {
        const response = await fetch(`/api/readings?nodeId=${nodeId}&limit=1`, {
          cache: "no-store",
        });
        if (!response.ok) return;
        const data = (await response.json()) as Reading[];
        if (!cancelled && data[0]) setLatestReading(data[0]);
      } catch {
        // Keep the last known reading on transient network failures.
      }
    }

    refreshLatest();
    const timer = window.setInterval(refreshLatest, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [nodeId]);

  return (
    <main className="min-h-screen bg-[#020617] text-slate-100">
      <div className="mx-auto w-full max-w-7xl px-3 pb-8 pt-3 sm:px-5 sm:pb-12 sm:pt-5 lg:px-8">
        <header className="sticky top-0 z-20 -mx-3 mb-3 border-b border-slate-800/80 bg-[#020617]/95 px-3 py-3 backdrop-blur sm:static sm:mx-0 sm:border-b-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-0">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="grid size-7 shrink-0 place-items-center rounded-md bg-emerald-400/10 ring-1 ring-inset ring-emerald-400/20">
                  <img src={icons.soil} alt="" className="size-4" />
                </span>
                <p className="truncate text-sm font-semibold tracking-tight text-white sm:text-base">SmartFarm</p>
              </div>
              <p className="mt-1 truncate pl-9 text-[11px] text-slate-500 sm:text-xs">Field monitoring · Node {String(nodeId).padStart(2, "0")}</p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <label className="hidden items-center gap-2 rounded-md border border-slate-800 bg-slate-900/80 px-2.5 py-2 text-[11px] text-slate-500 sm:flex">
                Node
                <select
                  value={nodeId}
                  onChange={(event) => setNodeId(Number(event.target.value))}
                  className="bg-transparent font-semibold text-slate-200 outline-none"
                >
                  {nodes.length ? (
                    nodes.map((node) => (
                      <option key={node} value={node}>
                        #{String(node).padStart(2, "0")}
                      </option>
                    ))
                  ) : (
                    <option value={1}>#01</option>
                  )}
                </select>
              </label>
              <Badge tone={online ? "success" : "warning"}>{online ? "Online" : "Offline"}</Badge>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2 sm:hidden">
            <span className="text-[10px] text-slate-500">Node</span>
            <select
              value={nodeId}
              onChange={(event) => setNodeId(Number(event.target.value))}
              className="rounded-md border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 outline-none"
            >
              {nodes.length ? (
                nodes.map((node) => (
                  <option key={node} value={node}>
                    #{String(node).padStart(2, "0")}
                  </option>
                ))
              ) : (
                <option value={1}>#01</option>
              )}
            </select>
          </div>
        </header>

        <section className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)] lg:gap-4">
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="grid size-7 place-items-center rounded-md bg-sky-400/10 ring-1 ring-inset ring-sky-400/10">
                      <img src={icons.soil} alt="" className="size-4" />
                    </span>
                    <p className="text-xs font-medium text-slate-400">Soil signal</p>
                  </div>
                  <div className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">{avg}</div>
                  <p className="mt-1 text-[11px] text-slate-500 sm:text-xs">Average raw ADC · latest sample</p>
                </div>
                <div className="text-right text-[10px] text-slate-500">
                  <div>Node {String(nodeId).padStart(2, "0")}</div>
                  <div className="mt-1">{lastUpdate}</div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <PlantHealthVisual latest={latest} readings={readings.length ? readings : initialReadings} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-slate-400">Node health</p>
                  <h2 className="mt-1 text-sm font-semibold text-white">Connection & sample</h2>
                </div>
                <Badge tone={online ? "success" : "warning"}>{online ? "Healthy" : "Stale"}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-slate-500">Received</span>
                  <span className="font-medium text-slate-200">{formatTime(latest?.received_at)}</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-slate-500">Packets</span>
                  <span className="font-medium text-slate-200">{latest?.packet_count ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Visible samples</span>
                  <span className="font-medium text-slate-200">{readings.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3 lg:gap-4">
          <Metric icon={icons.soil} label="Soil 1" value={latest ? String(latest.soil1_raw) : "—"} detail="Raw ADC" />
          <Metric icon={icons.soil} label="Soil 2" value={latest ? String(latest.soil2_raw) : "—"} detail="Raw ADC" />
          <Metric icon={icons.light} label="RSSI" value={latest ? `${latest.rssi_dbm} dBm` : "—"} detail="LoRa signal" />
          <Metric icon={icons.water} label="SNR" value={latest ? `${latest.snr_db} dB` : "—"} detail="Link quality" />
        </section>

        <Card className="mt-3 sm:mt-4">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400">Sensor analytics</p>
                <div className="mt-1 flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-white">Average soil signal</h2>
                  {loading ? <span className="text-[10px] text-slate-500">Updating…</span> : null}
                </div>
              </div>
              <div className="grid grid-cols-4 rounded-md border border-slate-800 bg-slate-950/50 p-0.5 sm:w-auto">
                {ranges.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setRange(item.value)}
                    className={`rounded px-2.5 py-1.5 text-[10px] font-semibold transition ${
                      range === item.value
                        ? "bg-slate-800 text-white"
                        : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {error ? <p className="mb-3 text-xs text-amber-400">{error}</p> : null}
            <TrendChart readings={readings} />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500">
              <span>Source: public.readings</span>
              <span>Last received {formatTime(latest?.received_at)}</span>
            </div>
          </CardContent>
        </Card>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:hidden">
          <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3.5">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
              <img src={icons.rain} alt="" className="size-4" />
              Environment
            </div>
            <p className="mt-2 text-[11px] leading-5 text-slate-500">
              Rainfall and light sensors will appear here when their fields are added to public.readings.
            </p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3.5">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
              <img src={icons.light} alt="" className="size-4" />
              Plant response
            </div>
            <p className="mt-2 text-[11px] leading-5 text-slate-500">
              The plant animation reacts to the current soil signal and connection quality.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
