import { NextResponse } from "next/server";
import { getAuthUserFromHeader } from "@/server/auth";
import { invokeCloudSnapshotSync } from "@/server/supabase";

export async function POST(request: Request) {
  const user = getAuthUserFromHeader(request.headers.get("Authorization"));
  if (!user || user.role !== "super_admin") {
    return NextResponse.json({ detail: "Super Admin privileges required." }, { status: 403 });
  }

  try {
    const result = await invokeCloudSnapshotSync();
    return NextResponse.json({
      ok: result.success,
      source: result.source,
      details: result.details,
      error: result.error,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to trigger cloud snapshot sync.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
