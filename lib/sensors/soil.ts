import type { Reading } from "@/types/readings";

// Centralized calibration so the UI can be updated without touching components.
// Current working calibration: wet endpoint 1585, dry endpoint 4095.
export const SOIL_WET_RAW = 1585;
export const SOIL_DRY_RAW = 4095;

export function rawToMoisturePercent(raw: number) {
  const value = ((SOIL_DRY_RAW - raw) / (SOIL_DRY_RAW - SOIL_WET_RAW)) * 100;
  return Math.min(100, Math.max(0, value));
}

export function soilField(sensor: "soil1" | "soil2" | "avg") {
  if (sensor === "soil1") return (reading: Reading) => Number(reading.soil1_raw);
  if (sensor === "soil2") return (reading: Reading) => Number(reading.soil2_raw);
  return (reading: Reading) => Number(reading.avg_raw);
}

export function soilLabel(sensor: "soil1" | "soil2" | "avg") {
  if (sensor === "soil1") return "Soil 1";
  if (sensor === "soil2") return "Soil 2";
  return "Average soil";
}
