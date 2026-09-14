import { NextResponse } from "next/server";
import { getHomepageBlocks } from "@/server/db";

export async function GET() {
  const blocks = getHomepageBlocks();
  const response = blocks.map((b) => ({
    id: b.id,
    block_type: b.block_type,
    display_order: b.display_order,
    content: b.content,
  }));

  return NextResponse.json(response);
}
