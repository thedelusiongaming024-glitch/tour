import { NextResponse } from "next/server";
import { getBookingById } from "@/server/db";
import { isTicketVisible, getTicketVisibilityStatus, TICKET_COMPANY_INFO } from "@/lib/ticketUtils";

export async function GET(
  _request: Request,
  props: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await props.params;
    const booking = getBookingById(bookingId);

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const visible = isTicketVisible(booking.departure_date);
    const status = getTicketVisibilityStatus(booking.departure_date);

    return NextResponse.json({
      booking,
      is_visible: visible,
      visibility_status: status,
      company: TICKET_COMPANY_INFO,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
