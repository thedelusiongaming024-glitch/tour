import { NextResponse } from "next/server";
import { createPayment, getBookingById } from "@/server/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { booking_id, payment_type = "advance" } = body;

    if (!booking_id) {
      return NextResponse.json({ detail: "booking_id is required." }, { status: 400 });
    }

    const booking = getBookingById(booking_id);
    if (!booking) {
      return NextResponse.json({ detail: "Booking not found." }, { status: 404 });
    }

    const amount = payment_type === "full" ? booking.total_price : booking.advance_amount;
    const payment = createPayment({
      booking_id: booking.id,
      amount,
      payment_type: payment_type === "full" ? "full" : "advance",
      payment_method: "sslcommerz",
    });

    const origin = new URL(request.url).origin;
    // Redirect to the built-in payment simulator
    const redirect_url = `${origin}/payments/simulator?tran_id=${payment.tran_id}&amount=${payment.amount}&reference=${booking.reference}&title=${encodeURIComponent(booking.tour_title)}`;

    return NextResponse.json({
      payment_id: payment.id,
      redirect_url,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to initiate payment.";
    return NextResponse.json({ detail: message }, { status: 400 });
  }
}
