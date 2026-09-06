export type Reading = {
  id: number;
  timestamp_ms: number;
  node_id: number;
  soil1_raw: number;
  soil2_raw: number;
  avg_raw: number;
  rssi_dbm: number;
  snr_db: number;
  packet_count: number;
  received_at: string;
};

export type ReadingRange = 1 | 6 | 24 | 168;
