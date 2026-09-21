import { NextResponse } from "next/server";
import { createBooking } from "@/server/db";
import { generateCustomerToken } from "@/server/auth";

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
      pickup_point,
      special_requests,
      selected_seats,
      promo_code,
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

    const { booking, customer } = await createBooking({
      tour_id,
      departure_id,
      traveler_count: Math.max(1, Number(traveler_count) || 1),
      payment_plan: payment_plan === "full" ? "full" : "partial",
      customer_full_name,
      customer_phone_number,
      customer_email,
      pickup_point: typeof pickup_point === "string" ? pickup_point.trim() : undefined,
      special_requests,
      selected_seats: Array.isArray(selected_seats) ? selected_seats : undefined,
      promo_code: typeof promo_code === "string" ? promo_code.trim() : undefined,
    });

    const customer_token = generateCustomerToken(customer);

    const response = NextResponse.json(
      {
        ...booking,
        customer,
        customer_token,
      },
      { status: 201 }
    );

    response.cookies.set("atithi_customer_token", customer_token, {
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
      sameSite: "lax",
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create booking.";
    return NextResponse.json({ detail: message }, { status: 400 });
  }
}

