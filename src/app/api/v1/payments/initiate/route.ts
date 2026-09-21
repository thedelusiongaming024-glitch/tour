import { NextResponse } from "next/server";
import { createPayment, getBookingById } from "@/server/db";
import { initiateSSLCommerzPayment, isSSLCommerzConfigured } from "@/lib/sslcommerz";

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
    const payment = await createPayment({
      booking_id: booking.id,
      amount,
      payment_type: payment_type === "full" ? "full" : "advance",
      payment_method: "sslcommerz",
    });

    const origin = new URL(request.url).origin;
    let redirect_url: string;

    if (isSSLCommerzConfigured()) {
      const sslRes = await initiateSSLCommerzPayment({
        tran_id: payment.tran_id,
        amount: payment.amount,
        cus_name: booking.customer_full_name,
        cus_phone: booking.customer_phone_number,
        cus_email: booking.customer_email,
        tour_title: booking.tour_title,
        origin,
        booking_id: booking.id,
        booking_ref: booking.reference,
      });

      if (sslRes.success && sslRes.gatewayUrl) {
        redirect_url = sslRes.gatewayUrl;
      } else {
        console.warn("SSLCommerz initiation failed, using simulator fallback:", sslRes.error);
        redirect_url = `${origin}/payments/simulator?tran_id=${payment.tran_id}&amount=${payment.amount}&reference=${booking.reference}&title=${encodeURIComponent(booking.tour_title)}`;
      }
    } else {
      // Redirect to the built-in payment simulator if credentials are not configured
      redirect_url = `${origin}/payments/simulator?tran_id=${payment.tran_id}&amount=${payment.amount}&reference=${booking.reference}&title=${encodeURIComponent(booking.tour_title)}`;
    }

    return NextResponse.json({
      payment_id: payment.id,
      redirect_url,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to initiate payment.";
    return NextResponse.json({ detail: message }, { status: 400 });
  }
}
