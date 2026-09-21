import { NextResponse } from "next/server";
import { getDestinations } from "@/server/db";

export async function GET() {
  const destinations = getDestinations();
  const results = destinations.map((d) => ({
    id: d.id,
    name: d.name,
    slug: d.slug,
    division: d.division,
    cover_image: d.cover_image,
    is_featured: d.is_featured,
    status: d.status,
  }));

  return NextResponse.json({ results });
}
