import { NextResponse } from "next/server";
import { verifyClearanceToken } from "@/server/clearance";
import { clearTicketOnTourDay, createPayment, getBookingById, getClearanceTicket, completeDuePayment } from "@/server/db";

export async function POST(
  request: Request,
  props: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await props.params;
    const body = await request.json();
    const token = body.token || new URL(request.url).searchParams.get("token");
    const method = body.method || "customer_self_pay";

    const ticket = getClearanceTicket(bookingId);
    if (!ticket) {
      return NextResponse.json({ detail: "No clearance ticket found for this booking." }, { status: 404 });
    }

    if (token) {
      const verify = verifyClearanceToken(token, bookingId, ticket.token_expires_at);
      if (!verify.valid) {
        if (verify.reason === "expired") {
          return NextResponse.json({ detail: "This clearance link has expired." }, { status: 410 });
        }
        return NextResponse.json({ detail: "Invalid clearance token." }, { status: 400 });
      }
    }

    const booking = getBookingById(bookingId);
    if (!booking) {
      return NextResponse.json({ detail: "Booking not found." }, { status: 404 });
    }

    if (parseFloat(booking.amount_due) <= 0) {
      return NextResponse.json({ detail: "No balance due. Booking is already fully paid." }, { status: 400 });
    }

    if (method === "host_cash" || method === "admin_settle") {
      const result = await completeDuePayment(bookingId, method === "host_cash" ? "host_cash" : "customer_self_pay");
      return NextResponse.json({
        status: "cleared",
        message: "Payment cleared successfully.",
        booking: {
          booking_reference: result.booking.reference,
          customer_name: result.booking.customer_full_name,
          tour_title: result.booking.tour_title,
          amount_paid: result.booking.amount_paid,
          amount_due: "0.00",
          is_cleared: true,
        },
      });
    }

    // Initiate final balance payment session under SSLCommerz Gateway
    const payment = await createPayment({
      booking_id: booking.id,
      amount: booking.amount_due,
      payment_type: "final",
      payment_method: "sslcommerz",
    });

    const origin = new URL(request.url).origin;
    let redirect_url: string;

    const { initiateSSLCommerzPayment, isSSLCommerzConfigured } = await import("@/lib/sslcommerz");

    if (isSSLCommerzConfigured() && method === "customer_self_pay") {
      const sslRes = await initiateSSLCommerzPayment({
        tran_id: payment.tran_id,
        amount: payment.amount,
        cus_name: booking.customer_full_name,
        cus_phone: booking.customer_phone_number,
        cus_email: booking.customer_email,
        tour_title: `${booking.tour_title} (Due Balance)`,
        origin,
        booking_id: booking.id,
        booking_ref: booking.reference,
      });

      if (sslRes.success && sslRes.gatewayUrl) {
        redirect_url = sslRes.gatewayUrl;
      } else {
        console.warn("SSLCommerz due initiation failed, using fallback:", sslRes.error);
        redirect_url = `${origin}/payments/simulator?tran_id=${payment.tran_id}&amount=${payment.amount}&reference=${booking.reference}&title=${encodeURIComponent(booking.tour_title + " (Balance Due)")}`;
      }
    } else {
      redirect_url = `${origin}/payments/simulator?tran_id=${payment.tran_id}&amount=${payment.amount}&reference=${booking.reference}&title=${encodeURIComponent(booking.tour_title + " (Balance Due)")}`;
    }

    return NextResponse.json(
      {
        payment_id: payment.id,
        redirect_url,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Payment initiation failed.";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
