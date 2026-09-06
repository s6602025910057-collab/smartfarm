"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import type { Reading } from "@/types/readings";
import { rawToMoisturePercent } from "@/lib/sensors/soil";
import { mockPlantEnvironment } from "@/lib/mock/sensor-data";

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

export function PlantHealthVisual({ latest, readings }: PlantHealthVisualProps) {
  const soil = useMemo(() => {
    if (!latest) return 0.62;
    return clamp(rawToMoisturePercent(Number(latest.avg_raw)) / 100);
  }, [latest]);

  const trend = useMemo(() => {
    if (readings.length < 2) return 0.5;
    const recent = readings.slice(0, Math.min(8, readings.length)).map((r) => rawToMoisturePercent(Number(r.avg_raw)));
    const first = recent.at(-1) ?? recent[0] ?? 0;
    const last = recent[0] ?? first;
    return clamp((last - first + 20) / 40);
  }, [readings]);

  // Water and light are intentionally mocked until their sensor fields are added to public.readings.
  const water = mockPlantEnvironment.water;
  const light = mockPlantEnvironment.light;
  const growth = clamp(0.55 * soil + 0.25 * water + 0.2 * light);
  const stress = clamp((0.35 * (1 - soil)) + (0.25 * (1 - water)) + (0.15 * (1 - light)) + (0.25 * (1 - trend)));

  return (
    <div className="relative h-[300px] w-full sm:h-[340px] lg:h-[380px]" aria-label="Interactive 3D plant visualization driven by soil moisture, water, and solar light inputs">
      <BananaPlantScene soil={soil} water={water} light={light} health={growth} stress={stress} />
      <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-1.5">
        <span className="rounded-full border border-line bg-background/75 px-2 py-1 text-[9px] font-medium text-muted backdrop-blur">Soil {(soil * 100).toFixed(0)}%</span>
        <span className="rounded-full border border-line bg-background/75 px-2 py-1 text-[9px] font-medium text-muted backdrop-blur">Water mock {(water * 100).toFixed(0)}%</span>
        <span className="rounded-full border border-line bg-background/75 px-2 py-1 text-[9px] font-medium text-muted backdrop-blur">Light mock {(light * 100).toFixed(0)}%</span>
      </div>
    </div>
  );
}
