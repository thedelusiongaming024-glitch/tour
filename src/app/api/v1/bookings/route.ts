import { NextResponse } from "next/server";
import { createBooking } from "@/server/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      tour_id,
      departure_id,
      traveler_count,
      payment_plan,
      customer_full_name,
      customer_phone_number,
      customer_email,
      special_requests,
    } = body;

    if (!tour_id) {
      return NextResponse.json({ tour_id: ["Tour ID is required."] }, { status: 400 });
    }
    if (!customer_full_name) {
      return NextResponse.json({ customer_full_name: ["Full name is required."] }, { status: 400 });
    }
    if (!customer_phone_number) {
      return NextResponse.json({ customer_phone_number: ["Phone number is required."] }, { status: 400 });
    }

    const booking = createBooking({
      tour_id,
      departure_id,
      traveler_count: Math.max(1, Number(traveler_count) || 1),
      payment_plan: payment_plan === "full" ? "full" : "partial",
      customer_full_name,
      customer_phone_number,
      customer_email,
      special_requests,
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create booking.";
    return NextResponse.json({ detail: message }, { status: 400 });
  }
}
