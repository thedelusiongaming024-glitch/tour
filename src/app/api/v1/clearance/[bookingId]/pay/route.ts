import { NextResponse } from "next/server";
import { verifyClearanceToken } from "@/server/clearance";
import { clearTicketOnTourDay, createPayment, getBookingById, getClearanceTicket } from "@/server/db";

export async function POST(
  request: Request,
  props: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await props.params;
    const body = await request.json();
    const token = body.token || new URL(request.url).searchParams.get("token");
    const method = body.method || "customer_self_pay";

    if (!token) {
      return NextResponse.json({ detail: "Invalid or missing clearance token." }, { status: 400 });
    }

    const ticket = getClearanceTicket(bookingId);
    if (!ticket) {
      return NextResponse.json({ detail: "No clearance ticket found for this booking." }, { status: 404 });
    }

    const verify = verifyClearanceToken(token, bookingId, ticket.token_expires_at);
    if (!verify.valid) {
      if (verify.reason === "expired") {
        return NextResponse.json({ detail: "This clearance link has expired." }, { status: 410 });
      }
      return NextResponse.json({ detail: "Invalid clearance token." }, { status: 400 });
    }

    const booking = getBookingById(bookingId);
    if (!booking) {
      return NextResponse.json({ detail: "Booking not found." }, { status: 404 });
    }

    if (parseFloat(booking.amount_due) <= 0) {
      return NextResponse.json({ detail: "No balance due." }, { status: 400 });
    }

    if (method === "host_cash") {
      const result = clearTicketOnTourDay(bookingId, "host_cash");
      return NextResponse.json({
        status: "cleared",
        message: "Payment cleared via on-site cash collection.",
        booking: {
          booking_reference: result.booking.reference,
          customer_name: result.booking.customer_full_name,
          tour_title: result.booking.tour_title,
          amount_due: "0.00",
          is_cleared: true,
        },
      });
    }

    // Initiate final balance payment session
    const payment = createPayment({
      booking_id: booking.id,
      amount: booking.amount_due,
      payment_type: "final",
      payment_method: method === "host_qr_scan" ? "host_pos" : "customer_self_pay",
    });

    const origin = new URL(request.url).origin;
    const redirect_url = `${origin}/payments/simulator?tran_id=${payment.tran_id}&amount=${payment.amount}&reference=${booking.reference}&title=${encodeURIComponent(booking.tour_title + " (Balance Due)")}`;

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
