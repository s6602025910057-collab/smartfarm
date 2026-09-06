"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PlantHealthVisual } from "@/components/dashboard/plant-health-visual";
import type { Reading, ReadingRange } from "@/types/readings";

type DashboardProps = { initialReadings: Reading[] };

const ALL_NODES = "all";
type NodeSelection = number | typeof ALL_NODES;

function formatNodeLabel(nodeId: NodeSelection) {
  return nodeId === ALL_NODES ? "All" : `Node ${String(nodeId).padStart(2, "0")}`;
}

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

type MetricKey = "soil1" | "soil2" | "rssi" | "snr";

type MetricConfig = {
  label: string;
  detail: string;
  icon: string;
  unit: string;
  color: string;
  decimals: number;
  field: (reading: Reading) => number;
};

const metricConfigs: Record<MetricKey, MetricConfig> = {
  soil1: {
    label: "Soil 1",
    detail: "Raw ADC",
    icon: icons.soil,
    unit: "",
    color: "#10b981",
    decimals: 0,
    field: (r) => Number(r.soil1_raw),
  },
  soil2: {
    label: "Soil 2",
    detail: "Raw ADC",
    icon: icons.soil,
    unit: "",
    color: "#0ea5e9",
    decimals: 0,
    field: (r) => Number(r.soil2_raw),
  },
  rssi: {
    label: "RSSI",
    detail: "LoRa signal",
    icon: icons.light,
    unit: " dBm",
    color: "#a78bfa",
    decimals: 0,
    field: (r) => Number(r.rssi_dbm),
  },
  snr: {
    label: "SNR",
    detail: "Link quality",
    icon: icons.water,
    unit: " dB",
    color: "#f59e0b",
    decimals: 2,
    field: (r) => Number(r.snr_db),
  },
};

const metricOrder: MetricKey[] = ["soil1", "soil2", "rssi", "snr"];

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

type ChartPoint = {
  x: number;
  y: number;
  value: number;
  reading: Reading;
};

function buildPoints(readings: Reading[], field: (r: Reading) => number): ChartPoint[] {
  const sorted = [...readings].sort(
    (a, b) => new Date(a.received_at).getTime() - new Date(b.received_at).getTime(),
  );

  if (!sorted.length) return [];
  if (sorted.length === 1) {
    const v = field(sorted[0]) || 0;
    return [{ x: 50, y: 50, value: v, reading: sorted[0] }];
  }

  const values = sorted.map(field);
  const finite = values.filter((v) => Number.isFinite(v));
  const min = finite.length ? Math.min(...finite) : 0;
  const max = finite.length ? Math.max(...finite) : 0;
  const spread = max - min || 1;

  return sorted.map((reading, index) => {
    const value = field(reading) || 0;
    return {
      x: (index / (sorted.length - 1)) * 100,
      y: 88 - ((value - min) / spread) * 68,
      value,
      reading,
    };
  });
}

function TrendChart({
  readings,
  metric,
}: {
  readings: Reading[];
  metric: MetricKey;
}) {
  const config = metricConfigs[metric];
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hover, setHover] = useState<{ point: ChartPoint; px: number; py: number } | null>(null);

  const points = useMemo(() => buildPoints(readings, config.field), [readings, config]);
  const line = points.map((p) => `${p.x},${p.y}`).join(" ");
  const area = points.length ? `0,100 ${line} 100,100` : "0,100 100,100";

  function handleMove(event: React.MouseEvent<SVGSVGElement>) {
    if (!points.length || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const index = Math.round(ratio * (points.length - 1));
    const point = points[index];
    setHover({
      point,
      px: point.x * (rect.width / 100),
      py: point.y * (rect.height / 100),
    });
  }

  const hoverValue = hover
    ? `${hover.point.value.toFixed(config.decimals)}${config.unit}`
    : "";

  return (
    <div className="relative h-52 w-full overflow-hidden rounded-md border border-line bg-muted/5 px-2 pt-4 sm:h-56">
      <div className="pointer-events-none absolute inset-x-2 top-[24%] border-t border-line/70" />
      <div className="pointer-events-none absolute inset-x-2 top-1/2 border-t border-line/70" />
      <div className="pointer-events-none absolute inset-x-2 top-[76%] border-t border-line/70" />

      {points.length > 0 ? (
        <>
          <svg
            ref={svgRef}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-x-2 top-3 h-40 w-[calc(100%-1rem)] cursor-crosshair sm:h-44"
            aria-label={`${config.label} trend chart`}
            onMouseMove={handleMove}
            onMouseLeave={() => setHover(null)}
          >
            <polyline points={area} fill={`${config.color}14`} stroke="none" />
            <polyline
              points={line}
              fill="none"
              stroke={config.color}
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
            {hover && (
              <line
                x1={hover.point.x}
                y1="0"
                x2={hover.point.x}
                y2="100"
                stroke={config.color}
                strokeWidth="1"
                strokeDasharray="4 3"
                vectorEffect="non-scaling-stroke"
                opacity="0.6"
              />
            )}
            {points.map((point, index) => (
              <circle
                key={`${point.x}-${index}`}
                cx={point.x}
                cy={point.y}
                r={hover?.point === point ? "2" : "1.15"}
                fill={config.color}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>

          {hover && (
            <div
              className="pointer-events-none absolute z-10 max-w-[220px] rounded-md border border-line bg-surface/95 px-2.5 py-1.5 text-[10px] leading-4 shadow-lg backdrop-blur"
              style={{
                left: `clamp(0.5rem, ${hover.px}px - 60px, calc(100% - 11rem))`,
                top: `clamp(0.25rem, ${hover.py}px - 52px, 55%)`,
              }}
            >
              <div className="font-semibold text-foreground">
                {hoverValue}
                <span className="ml-1 font-normal text-muted">{config.label}</span>
              </div>
              <div className="mt-0.5 text-muted">
                {formatTime(hover.point.reading.received_at)}
                {hover.point.reading.node_id !== undefined && (
                  <span className="ml-1">· node {hover.point.reading.node_id}</span>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex h-40 items-center justify-center px-4 text-center text-xs text-muted sm:h-44">
          No readings in this time window
        </div>
      )}

      <div className="absolute inset-x-2 bottom-3 flex justify-between text-[10px] text-muted">
        <span>Start</span>
        <span>{points.length} samples</span>
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
  active,
  color,
  onSelect,
}: {
  icon: string;
  label: string;
  value: string;
  detail: string;
  active: boolean;
  color: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={`group rounded-lg border p-3.5 text-left transition-colors ${
        active
          ? "border-transparent bg-surface"
          : "border-line bg-surface/60 hover:bg-surface"
      }`}
      style={active ? { boxShadow: `inset 0 0 0 1.5px ${color}` } : undefined}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
          <span className="grid size-5 place-items-center rounded-md bg-muted/10 ring-1 ring-inset ring-line">
            <img src={icon} alt="" className="size-3.5" />
          </span>
          {label}
        </span>
        <span
          className="size-1.5 rounded-full"
          style={{ backgroundColor: active ? color : "var(--line)" }}
        />
      </div>
      <div className="mt-3 min-w-0 truncate text-[15px] font-semibold text-foreground sm:text-base">
        {value}
      </div>
      <div className="mt-1 text-[11px] leading-4 text-muted">{detail}</div>
    </button>
  );
}

export function SmartFarmDashboardHome({ initialReadings }: DashboardProps) {
  const [nodeId, setNodeId] = useState<NodeSelection>(ALL_NODES);
  const [range, setRange] = useState<ReadingRange>(168);
  const [metric, setMetric] = useState<MetricKey>("soil1");
  const [readings, setReadings] = useState<Reading[]>(initialReadings);
  const [latestReading, setLatestReading] = useState<Reading | undefined>(initialReadings[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const nodes = useMemo(
    () => [...new Set([1, 2, 3, 4, 5, ...initialReadings.map((item) => item.node_id)])].sort((a, b) => a - b),
    [initialReadings],
  );

  const latest = latestReading;
  const online = isOnline(latest?.received_at);
  const activeConfig = metricConfigs[metric];
  const latestValue = latest ? activeConfig.field(latest) : NaN;
  const avg = Number.isFinite(latestValue)
    ? latestValue.toFixed(activeConfig.decimals)
    : "—";
  const lastUpdate = formatAge(latest?.received_at);
  const nodeLabel = formatNodeLabel(nodeId);

  useEffect(() => {
    let cancelled = false;

    async function loadTrend() {
      setLoading(true);
      setError("");
      try {
        const nodeParam = nodeId === ALL_NODES ? "" : `nodeId=${nodeId}&`;
        const response = await fetch(`/api/readings?${nodeParam}hours=${range}&limit=100`, {
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
        const nodeParam = nodeId === ALL_NODES ? "" : `nodeId=${nodeId}&`;
        const response = await fetch(`/api/readings?${nodeParam}limit=1`, {
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
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-7xl px-3 pb-8 pt-3 sm:px-5 sm:pb-12 sm:pt-5 lg:px-8">
        <section className="mt-1 grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)] lg:gap-4">
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="grid size-7 place-items-center rounded-md bg-sky-400/10 ring-1 ring-inset ring-sky-400/10">
                      <img src={icons.soil} alt="" className="size-4" />
                    </span>
                    <p className="text-xs font-medium text-muted">Soil signal</p>
                  </div>
                  <div className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{avg}</div>
                  <p className="mt-1 text-[11px] text-muted sm:text-xs">
                    {activeConfig.label} · latest sample
                  </p>
                </div>
                <div className="text-right text-[10px] text-muted">
                  <div>{nodeLabel}</div>
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
                  <p className="text-xs font-medium text-muted">Node health</p>
                  <h2 className="mt-1 text-sm font-semibold text-foreground">Connection & sample</h2>
                </div>
                <Badge tone={online ? "success" : "warning"}>{online ? "Online" : "Offline"}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 rounded-lg border border-line bg-surface/60 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Node</div>
                    <div className="mt-1 text-sm font-semibold text-foreground">{nodeLabel}</div>
                  </div>
                  <select
                    value={nodeId}
                    onChange={(event) =>
                      setNodeId(
                        event.target.value === ALL_NODES
                          ? ALL_NODES
                          : Number(event.target.value),
                      )
                    }
                    aria-label="Select node"
                    className="rounded-md border border-line bg-background px-2.5 py-2 text-xs font-semibold text-foreground outline-none"
                  >
                    <option value={ALL_NODES}>All</option>
                    {nodes.map((node) => (
                      <option key={node} value={node}>
                        #{String(node).padStart(2, "0")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-line pb-3">
                  <span className="text-muted">Last received</span>
                  <span className="font-medium text-foreground">{formatTime(latest?.received_at)}</span>
                </div>
                <div className="flex items-center justify-between border-b border-line pb-3">
                  <span className="text-muted">Last update</span>
                  <span className="font-medium text-foreground">{lastUpdate}</span>
                </div>
                <div className="flex items-center justify-between border-b border-line pb-3">
                  <span className="text-muted">Packets</span>
                  <span className="font-medium text-foreground">{latest?.packet_count ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Visible samples</span>
                  <span className="font-medium text-foreground">{readings.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3 lg:gap-4">
          {metricOrder.map((key) => {
            const config = metricConfigs[key];
            const value = latest ? config.field(latest) : NaN;
            return (
              <Metric
                key={key}
                icon={config.icon}
                label={config.label}
                value={Number.isFinite(value) ? `${value.toFixed(config.decimals)}${config.unit}` : "—"}
                detail={config.detail}
                active={metric === key}
                color={config.color}
                onSelect={() => setMetric(key)}
              />
            );
          })}
        </section>

        <Card className="mt-3 sm:mt-4">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-medium text-muted">Sensor analytics</p>
                <div className="mt-1 flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-foreground">
                    {activeConfig.label} trend
                  </h2>
                  {loading ? <span className="text-[10px] text-muted">Updating…</span> : null}
                </div>
              </div>
              <div className="grid grid-cols-4 rounded-md border border-line bg-muted/5 p-0.5 sm:w-auto">
                {ranges.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setRange(item.value)}
                    className={`rounded px-2.5 py-1.5 text-[10px] font-semibold transition ${
                      range === item.value
                        ? "bg-muted/20 text-foreground"
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {error ? <p className="mb-3 text-xs text-amber-500">{error}</p> : null}
            <TrendChart readings={readings} metric={metric} />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted">
              <span>Source: public.readings</span>
              <span>Last received {formatTime(latest?.received_at)}</span>
            </div>
          </CardContent>
        </Card>

        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:hidden">
          <div className="rounded-lg border border-line bg-surface/40 p-3.5">
            <div className="flex items-center gap-2 text-xs font-medium text-soft">
              <img src={icons.rain} alt="" className="size-4" />
              Environment
            </div>
            <p className="mt-2 text-[11px] leading-5 text-muted">
              Rainfall and light sensors will appear here when their fields are added to public.readings.
            </p>
          </div>
          <div className="rounded-lg border border-line bg-surface/40 p-3.5">
            <div className="flex items-center gap-2 text-xs font-medium text-soft">
              <img src={icons.light} alt="" className="size-4" />
              Plant response
            </div>
            <p className="mt-2 text-[11px] leading-5 text-muted">
              The plant animation reacts to the current soil signal and connection quality.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
