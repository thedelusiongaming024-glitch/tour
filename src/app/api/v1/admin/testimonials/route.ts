import { NextResponse } from "next/server";
import { getAuthUserFromHeader } from "@/server/auth";
import { getAllTestimonialsAdmin, saveTestimonial } from "@/server/db";

export async function GET(request: Request) {
  const user = getAuthUserFromHeader(request.headers.get("Authorization"));
  if (!user || user.role !== "super_admin") {
    return NextResponse.json({ detail: "Super Admin privileges required." }, { status: 403 });
  }

  const testimonials = getAllTestimonialsAdmin();
  return NextResponse.json({ results: testimonials });
}

export async function POST(request: Request) {
  const user = getAuthUserFromHeader(request.headers.get("Authorization"));
  if (!user || user.role !== "super_admin") {
    return NextResponse.json({ detail: "Super Admin privileges required." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const testimonial = saveTestimonial(body);
    return NextResponse.json(testimonial, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to save testimonial.";
    return NextResponse.json({ detail: message }, { status: 400 });
  }
}
