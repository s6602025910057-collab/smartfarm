import type { Reading } from "@/types/readings";

const READING_COLUMNS = [
  "id",
  "timestamp_ms",
  "node_id",
  "soil1_raw",
  "soil2_raw",
  "avg_raw",
  "rssi_dbm",
  "snr_db",
  "packet_count",
  "received_at",
].join(",");

function getConfig() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    return null;
  }

  return { url: url.replace(/\/$/, ""), key };
}

export async function getReadings(options?: {
  nodeId?: number;
  hours?: number;
  limit?: number;
}): Promise<Reading[]> {
  const config = getConfig();
  if (!config) return [];

  const params = new URLSearchParams({
    select: READING_COLUMNS,
    order: "received_at.desc",
    limit: String(Math.min(Math.max(options?.limit ?? 100, 1), 500)),
  });

  if (options?.nodeId !== undefined) {
    params.set("node_id", `eq.${options.nodeId}`);
  }

  if (options?.hours !== undefined && options.hours > 0) {
    const since = new Date(Date.now() - options.hours * 60 * 60 * 1000);
    params.set("received_at", `gte.${since.toISOString()}`);
  }

  const response = await fetch(`${config.url}/rest/v1/readings?${params}`, {
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Supabase request failed: ${response.status}`);
  }

  return (await response.json()) as Reading[];
}

export async function getLatestReadings(limit = 50) {
  return getReadings({ limit });
}
