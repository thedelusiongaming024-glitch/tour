import { NextResponse } from "next/server";
import { fetchDatabaseFromSupabase, syncDatabaseToSupabase } from "@/server/supabase";

/**
 * Supabase Database Webhook Handler
 * Triggered automatically by Supabase Cloud whenever database tables are modified.
 * Recompiles the snapshot and updates atithi-data/db.json in the storage bucket.
 */
export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    // Read payload from Supabase Webhook (contains table, type, record, schema)
    let body: any = null;
    try {
      body = await request.json();
    } catch {
      // Body may be empty on manual triggers
    }

    const table = body?.table || "unknown";
    const type = body?.type || "TRIGGER";

    console.log(`[Supabase Webhook] Received ${type} event on table '${table}'. Rebuilding snapshot mirror...`);

    // 1. Fetch latest state across all tables from Supabase PostgreSQL
    const freshDb = await fetchDatabaseFromSupabase();
    if (!freshDb) {
      return NextResponse.json(
        { ok: false, error: "Failed to fetch PostgreSQL records" },
        { status: 500 }
      );
    }

    // 2. Upload the updated JSON mirror to 'atithi-data/db.json' with CDN cache header
    const ok = await syncDatabaseToSupabase(freshDb);

    const durationMs = Date.now() - startTime;

    return NextResponse.json({
      ok,
      message: "Storage bucket mirror refreshed successfully",
      table,
      type,
      duration_ms: durationMs,
      stats: {
        destinations: freshDb.destinations.length,
        tours: freshDb.tours.length,
        offers: freshDb.offers.length,
        testimonials: freshDb.testimonials.length,
        blogPosts: freshDb.blogPosts.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[Supabase Webhook] Error rebuilding snapshot mirror:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Internal error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ready",
    endpoint: "/api/v1/supabase/webhook",
    purpose: "Supabase Database Webhook to mirror PostgreSQL changes into Storage Bucket (atithi-data/db.json)",
  });
}
