import { NextResponse } from "next/server";
import { getTours } from "@/server/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const destinationSlug = searchParams.get("destination__slug") || undefined;
  const category = searchParams.get("category") || undefined;

  const tours = getTours(destinationSlug, category);
  const results = tours.map((t) => ({
    id: t.id,
    title: t.title,
    slug: t.slug,
    destination: t.destination_slug,
    destination_name: t.destination_name,
    category: t.category,
    short_description: t.short_description,
    hero_image: t.hero_image,
    duration_days: t.duration_days,
    duration_nights: t.duration_nights,
    base_price: t.base_price,
    final_price: t.final_price,
    is_featured: t.is_featured,
    status: t.status,
  }));

  return NextResponse.json({ results });
}
