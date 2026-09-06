"use client";

import { useMemo, useRef, useState } from "react";
import type { MockPoint } from "@/lib/mock/sensor-data";

type Point = MockPoint & { x: number; y: number };

function formatAxisTime(value: string) {
  return new Intl.DateTimeFormat("th-TH", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export function LineChart({ data, unit, label, color = "#10b981" }: { data: MockPoint[]; unit: string; label: string; color?: string }) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hover, setHover] = useState<Point | null>(null);

  const points = useMemo<Point[]>(() => {
    if (!data.length) return [];
    const values = data.map((item) => item.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const spread = max - min || 1;
    return data.map((item, index) => ({
      ...item,
      x: data.length === 1 ? 50 : (index / (data.length - 1)) * 100,
      y: 86 - ((item.value - min) / spread) * 68,
    }));
  }, [data]);

  function onMove(event: React.MouseEvent<SVGSVGElement>) {
    if (!svgRef.current || !points.length) return;
    const rect = svgRef.current.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    setHover(points[Math.round(ratio * (points.length - 1))]);
  }

  const line = points.map((p) => `${p.x},${p.y}`).join(" ");
  const area = points.length ? `0,100 ${line} 100,100` : "0,100 100,100";
  const labels = points.length ? [points[0], points[Math.floor(points.length / 2)], points[points.length - 1]] : [];

  return (
    <div className="relative h-72 w-full rounded-xl border border-line/80 bg-muted/5 p-3 sm:h-80">
      <div className="pointer-events-none absolute inset-x-3 top-[24%] border-t border-line/60" />
      <div className="pointer-events-none absolute inset-x-3 top-1/2 border-t border-line/60" />
      <div className="pointer-events-none absolute inset-x-3 top-[76%] border-t border-line/60" />
      {points.length ? (
        <>
          <svg ref={svgRef} viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-x-3 top-4 h-[calc(100%-3rem)] w-[calc(100%-1.5rem)]" onMouseMove={onMove} onMouseLeave={() => setHover(null)} role="img" aria-label={label}>
            <polyline points={area} fill={`${color}12`} stroke="none" />
            <polyline points={line} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            {hover ? <line x1={hover.x} x2={hover.x} y1="0" y2="100" stroke={color} strokeWidth="1" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" opacity="0.55" /> : null}
            {points.map((point, index) => <circle key={`${point.timestamp}-${index}`} cx={point.x} cy={point.y} r={hover?.timestamp === point.timestamp ? 2 : 1.1} fill={color} vectorEffect="non-scaling-stroke" />)}
          </svg>
          {hover ? (
            <div className="pointer-events-none absolute z-10 rounded-lg border border-line bg-surface px-3 py-2 text-[11px] shadow-xl">
              <div className="font-semibold text-foreground">{hover.value.toLocaleString("en-US")}{unit}</div>
              <div className="mt-0.5 text-muted">{formatAxisTime(hover.timestamp)}</div>
            </div>
          ) : null}
          <div className="absolute inset-x-3 bottom-2 flex justify-between text-[10px] text-muted">
            {labels.map((point, index) => <span key={`${point.timestamp}-${index}`}>{formatAxisTime(point.timestamp)}</span>)}
          </div>
        </>
      ) : (
        <div className="grid h-full place-items-center text-xs text-muted">No data</div>
      )}
    </div>
  );
}
