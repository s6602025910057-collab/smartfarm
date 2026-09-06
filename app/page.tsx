import { SmartFarmDashboard } from "@/components/dashboard/smartfarm-dashboard";
import { getLatestReadings } from "@/lib/supabase/rest";
import type { Reading } from "@/types/readings";

export const dynamic = "force-dynamic";

export default async function Home() {
  let initialReadings: Reading[] = [];

  try {
    initialReadings = await getLatestReadings(100);
  } catch {
    // The dashboard still renders its empty/error state when env or API access is unavailable.
  }

  return <SmartFarmDashboard initialReadings={initialReadings} />;
}
