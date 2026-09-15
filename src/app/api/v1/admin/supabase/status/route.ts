import { NextResponse } from "next/server";
import { checkSupabaseHealth, syncDatabaseToSupabase } from "@/server/supabase";
import { getRawDb } from "@/server/db";

export async function GET() {
  const health = await checkSupabaseHealth();
  return NextResponse.json(health);
}

export async function POST() {
  const rawDb = getRawDb();
  const ok = await syncDatabaseToSupabase(rawDb);
  const health = await checkSupabaseHealth();
  return NextResponse.json({ ok, ...health });
}
