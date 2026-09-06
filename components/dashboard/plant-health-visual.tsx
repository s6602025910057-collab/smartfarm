"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import type { Reading } from "@/types/readings";

type PlantHealthVisualProps = {
  latest?: Reading;
  readings: Reading[];
};

const BananaPlantScene = dynamic(() => import("./banana-plant-scene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[240px] w-full items-center justify-center rounded-md border border-line bg-muted/5 text-xs text-muted sm:min-h-[300px]">
      Loading 3D plant…
    </div>
  ),
});

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function getRelativeSoilVigor(latest: Reading | undefined, readings: Reading[]) {
  if (!latest || readings.length < 2) return 0.62;

  const values = readings
    .map((reading) => Number(reading.avg_raw))
    .filter((value) => Number.isFinite(value));

  if (!values.length) return 0.62;

  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return 0.62;

  return clamp((Number(latest.avg_raw) - min) / (max - min));
}

export function PlantHealthVisual({ latest, readings }: PlantHealthVisualProps) {
  const soilVigor = getRelativeSoilVigor(latest, readings);
  const snr = latest ? Number(latest.snr_db) : 0;
  const signalQuality = clamp((snr + 10) / 20);
  const health = clamp(0.72 * soilVigor + 0.28 * signalQuality);

  return (
    <div
      className="h-[300px] w-full sm:h-[340px] lg:h-[380px]"
      aria-label="Interactive 3D plant health visualization (drag to rotate, scroll to zoom)"
    >
      <BananaPlantScene health={health} />
    </div>
  );
}
