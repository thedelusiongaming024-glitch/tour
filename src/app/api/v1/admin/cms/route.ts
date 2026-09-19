import { NextResponse } from "next/server";
import { getAuthUserFromHeader } from "@/server/auth";
import { getHomepageBlocks, saveHomepageBlock } from "@/server/db";

export async function GET(request: Request) {
  const user = getAuthUserFromHeader(request.headers.get("Authorization"));
  if (!user || user.role !== "super_admin") {
    return NextResponse.json({ detail: "Super Admin privileges required." }, { status: 403 });
  }

  const blocks = getHomepageBlocks();
  return NextResponse.json({ results: blocks });
}

export async function POST(request: Request) {
  const user = getAuthUserFromHeader(request.headers.get("Authorization"));
  if (!user || user.role !== "super_admin") {
    return NextResponse.json({ detail: "Super Admin privileges required." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, block_type, content } = body;

    if (!id || !block_type) {
      return NextResponse.json({ detail: "id and block_type are required." }, { status: 400 });
    }

    const updated = await saveHomepageBlock(id, block_type, content || {});
    return NextResponse.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to save CMS block.";
    return NextResponse.json({ detail: message }, { status: 400 });
  }
}
