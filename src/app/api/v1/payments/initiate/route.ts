import { NextResponse } from "next/server";
import { createPayment, getBookingById } from "@/server/db";
import { initiateSSLCommerzPayment, isSSLCommerzConfigured } from "@/lib/sslcommerz";
import { isPaymentSimulatorEnabled } from "@/lib/paymentMode";
import { limitOr429 } from "@/server/rateLimit";

export async function POST(request: Request) {
  const limited = await limitOr429(request, "payments-initiate", 20, 10 * 60 * 1000);
  if (limited) return limited;

  try {
    const body = await request.json();
    const { booking_id, payment_type = "advance" } = body;

    if (!booking_id || typeof booking_id !== "string") {
      return NextResponse.json({ detail: "booking_id is required." }, { status: 400 });
    }

    const booking = getBookingById(booking_id);
    if (!booking) {
      return NextResponse.json({ detail: "Booking not found." }, { status: 404 });
    }

    if (booking.status === "cancelled" || booking.status === "refunded") {
      return NextResponse.json({ detail: "This booking is no longer active." }, { status: 400 });
    }

    const amountDue = parseFloat(booking.amount_due);
    if (!Number.isFinite(amountDue) || amountDue <= 0) {
      return NextResponse.json({ detail: "This booking is already fully paid." }, { status: 400 });
    }

    // Amounts always come from the server-side booking, never from the request. "full" pays what is
    // still outstanding (not the original total, which over-charged after an advance), and an
    // advance can only be requested while nothing has been paid yet.
    const isFull = payment_type === "full";
    const alreadyPaid = parseFloat(booking.amount_paid) || 0;
    if (!isFull && alreadyPaid > 0) {
      return NextResponse.json(
        { detail: "The advance is already paid. Please pay the remaining balance instead." },
        { status: 400 }
      );
    }
    const amount = isFull
      ? amountDue
      : Math.min(parseFloat(booking.advance_amount), amountDue);

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ detail: "Invalid payment amount for this booking." }, { status: 400 });
    }

    const payment = await createPayment({
      booking_id: booking.id,
      amount: amount.toFixed(2),
      payment_type: isFull ? "full" : "advance",
      payment_method: "sslcommerz",
    });

    const origin = new URL(request.url).origin;
    const simulatorUrl = `${origin}/payments/simulator?tran_id=${encodeURIComponent(payment.tran_id)}&amount=${payment.amount}&reference=${encodeURIComponent(booking.reference)}&title=${encodeURIComponent(booking.tour_title)}`;
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
      } else if (isPaymentSimulatorEnabled()) {
        console.warn("SSLCommerz initiation failed, using simulator fallback:", sslRes.error);
        redirect_url = simulatorUrl;
      } else {
        // In production a gateway outage must NEVER fall back to the fake "pay for free" simulator.
        console.error("SSLCommerz initiation failed:", sslRes.error);
        return NextResponse.json(
          { detail: "The payment gateway is temporarily unavailable. Please try again shortly." },
          { status: 502 }
        );
      }
    } else if (isPaymentSimulatorEnabled()) {
      redirect_url = simulatorUrl;
    } else {
      console.error("Payment initiation attempted but SSLCommerz is not configured.");
      return NextResponse.json({ detail: "Online payment is not available right now." }, { status: 503 });
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
