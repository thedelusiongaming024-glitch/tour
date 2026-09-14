import { NextResponse } from "next/server";
import { getOffers } from "@/server/db";

export async function GET() {
  const offers = getOffers();
  const results = offers.map((o) => ({
    title: o.title,
    description: o.description,
    slug: o.slug,
    tour_slug: o.tour_slug,
    valid_until: o.valid_until,
    banner_image: o.banner_image,
  }));

  return NextResponse.json({ results });
}
