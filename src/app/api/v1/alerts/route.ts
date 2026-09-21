import { NextResponse } from "next/server";
import { getAuthUserFromHeader } from "@/server/auth";
import { getAlerts } from "@/server/db";

export async function GET(request: Request) {
  const authUser = getAuthUserFromHeader(request.headers.get("Authorization"));
  if (!authUser) {
    return NextResponse.json({ detail: "Authentication credentials were not provided." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const isAckParam = searchParams.get("is_acknowledged");
  const isAcknowledged = isAckParam !== null ? isAckParam === "true" : undefined;

  const results = getAlerts(isAcknowledged);
  return NextResponse.json({ results });
}
