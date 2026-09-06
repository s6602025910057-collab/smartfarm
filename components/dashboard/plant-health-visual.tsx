"use client";

import type { Reading } from "@/types/readings";

type PlantHealthVisualProps = {
  latest?: Reading;
  readings: Reading[];
};

const PLANT_IMAGE =
  "https://www.figma.com/api/mcp/asset/befe115c-903d-40a9-8525-26ff1b76ffe3.png";
const DROPLET_ICON =
  "https://www.figma.com/api/mcp/asset/f55c5330-1df9-4744-b64d-dece934fdfba.svg";
const SUN_ICON =
  "https://www.figma.com/api/mcp/asset/3709c015-6d61-4868-883e-73b347402f5e.svg";

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

  const breathe = `${(2.2 - health * 1.0).toFixed(2)}s`;
  const sway = `${(5.8 - health * 2.0).toFixed(2)}s`;
  const glow = 0.08 + health * 0.16;
  const imageOpacity = 0.72 + health * 0.28;

  return (
    <div
      className="plant-visual"
      style={
        {
          "--plant-breathe": breathe,
          "--plant-sway": sway,
          "--plant-glow": glow,
          "--plant-opacity": imageOpacity,
        } as React.CSSProperties
      }
      aria-label="Animated plant health visualization"
    >
      <div className="plant-visual__halo" />
      <div className="plant-visual__stage">
        <img
          src={PLANT_IMAGE}
          alt="Smart crop plant"
          className="plant-visual__image"
        />
        <div className="plant-visual__pulse" />
      </div>

      <div className="plant-visual__signals" aria-hidden="true">
        <span className="plant-visual__signal">
          <img src={DROPLET_ICON} alt="" />
          <span>Soil response</span>
        </span>
        <span className="plant-visual__signal plant-visual__signal--muted">
          <img src={SUN_ICON} alt="" />
          <span>Light data pending</span>
        </span>
      </div>
    </div>
  );
}
