import { NextResponse } from "next/server";
import { getReadings } from "@/lib/supabase/rest";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const nodeParam = url.searchParams.get("nodeId");
  const hoursParam = url.searchParams.get("hours");
  const limitParam = url.searchParams.get("limit");

  const nodeId = nodeParam ? Number(nodeParam) : undefined;
  const hours = hoursParam ? Number(hoursParam) : undefined;
  const limit = limitParam ? Number(limitParam) : 100;

  if (nodeId !== undefined && (!Number.isInteger(nodeId) || nodeId < 1)) {
    return NextResponse.json({ error: "Invalid nodeId" }, { status: 400 });
  }
  if (
    hours !== undefined &&
    (!Number.isFinite(hours) || hours <= 0 || hours > 24 * 31)
  ) {
    return NextResponse.json({ error: "Invalid hours" }, { status: 400 });
  }
  if (!Number.isFinite(limit) || limit < 1 || limit > 500) {
    return NextResponse.json({ error: "Invalid limit" }, { status: 400 });
  }

  try {
    const readings = await getReadings({ nodeId, hours, limit });
    return NextResponse.json(readings, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ error: "Unable to load readings" }, { status: 502 });
  }
}
