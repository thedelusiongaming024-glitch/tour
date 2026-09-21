import { NextResponse } from "next/server";
import { checkSupabaseHealth, invokeCloudSnapshotSync } from "@/server/supabase";

export async function GET() {
  const health = await checkSupabaseHealth();
  return NextResponse.json(health);
}

export async function POST() {
  const syncResult = await invokeCloudSnapshotSync();
  const health = await checkSupabaseHealth();
  return NextResponse.json({ ok: syncResult.success, syncResult, ...health });
}

