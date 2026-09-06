"use client";

import { useMemo } from "react";

export function AcousticProfile({ seed = 1 }: { seed?: number }) {
  const bars = useMemo(
    () => Array.from({ length: 32 }, (_, index) => Math.max(12, Math.min(92, 42 + Math.sin(index * 0.72 + seed) * 26 + Math.cos(index * 0.29) * 11))),
    [seed],
  );

  return (
    <div className="rounded-xl border border-line/80 bg-muted/5 p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Acoustic profile</div>
          <div className="mt-1 text-xs text-foreground">Insect activity frequency bands</div>
        </div>
        <span className="text-[10px] text-muted">Mock spectrum</span>
      </div>
      <div className="flex h-28 items-end gap-1 overflow-hidden rounded-lg bg-background/70 px-2 py-2">
        {bars.map((height, index) => (
          <div key={index} className="flex-1 rounded-sm bg-violet-400/70" style={{ height: `${height}%` }} />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[9px] text-muted">
        <span>2 kHz</span><span>4 kHz</span><span>6 kHz</span><span>8 kHz</span>
      </div>
    </div>
  );
}
