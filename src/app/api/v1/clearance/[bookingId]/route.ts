import { NextResponse } from "next/server";
import { verifyClearanceToken } from "@/server/clearance";
import { getBookingById, getClearanceTicket } from "@/server/db";

export async function GET(
  request: Request,
  props: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await props.params;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

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

    const dueNum = parseFloat(booking.amount_due);
    const isCleared = ticket.is_cleared || dueNum <= 0;

    const bookingPayload = {
      booking_reference: booking.reference,
      customer_name: booking.customer_full_name,
      tour_title: booking.tour_title,
      amount_due: booking.amount_due,
      is_cleared: isCleared,
    };

    if (isCleared) {
      return NextResponse.json({
        status: "verified",
        message: "Booking Confirmed — Fully Paid",
        booking: bookingPayload,
      });
    }

    return NextResponse.json({
      status: "due_pending",
      message: "Remaining balance due — proceed to payment.",
      amount_due: booking.amount_due,
      booking: bookingPayload,
      pay_endpoint: `/api/v1/clearance/${bookingId}/pay/`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
