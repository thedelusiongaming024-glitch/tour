import { NextResponse } from "next/server";
import { verifyClearanceToken } from "@/server/clearance";
import { createPayment, getBookingById, getClearanceTicket, completeDuePayment } from "@/server/db";
import { getAuthUserFromHeader } from "@/server/auth";
import { resolveBookingAccess } from "@/server/access";
import { isPaymentSimulatorEnabled } from "@/lib/paymentMode";
import { limitOr429 } from "@/server/rateLimit";

const CASH_SETTLE_ROLES = ["super_admin", "finance_manager", "tour_host"];

export async function POST(
  request: Request,
  props: { params: Promise<{ bookingId: string }> }
) {
  const limited = await limitOr429(request, "clearance-pay", 30, 10 * 60 * 1000);
  if (limited) return limited;

  try {
    const { bookingId } = await props.params;
    const body = await request.json().catch(() => ({}));
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

    // Marking a balance as paid in cash is a STAFF action. Previously anyone who knew a booking id
    // could POST {"method":"host_cash"} and settle the balance for free (the token check was skipped
    // entirely when no token was sent).
    if (method === "host_cash" || method === "admin_settle") {
      const staff = getAuthUserFromHeader(request.headers.get("authorization"));
      if (!staff || !CASH_SETTLE_ROLES.includes(staff.role)) {
        return NextResponse.json({ detail: "Staff authentication required to settle a balance." }, { status: 403 });
      }
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

    // Online payment of the balance: the caller must prove access to this booking
    // (valid signed token, the signed-in owner, or staff).
    const access = resolveBookingAccess(request, booking, token, ticket.token_expires_at);
    if (!access) {
      return NextResponse.json({ detail: "A valid clearance link or sign-in is required." }, { status: 401 });
    }

    // Initiate final balance payment session under SSLCommerz Gateway
    const payment = await createPayment({
      booking_id: booking.id,
      amount: booking.amount_due,
      payment_type: "final",
      payment_method: "sslcommerz",
    });

    const origin = new URL(request.url).origin;
    const simulatorUrl = `${origin}/payments/simulator?tran_id=${encodeURIComponent(payment.tran_id)}&amount=${payment.amount}&reference=${encodeURIComponent(booking.reference)}&title=${encodeURIComponent(booking.tour_title + " (Balance Due)")}`;
    let redirect_url: string;

    const { initiateSSLCommerzPayment, isSSLCommerzConfigured } = await import("@/lib/sslcommerz");

    if (isSSLCommerzConfigured()) {
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
      } else if (isPaymentSimulatorEnabled()) {
        console.warn("SSLCommerz due initiation failed, using fallback:", sslRes.error);
        redirect_url = simulatorUrl;
      } else {
        console.error("SSLCommerz due initiation failed:", sslRes.error);
        return NextResponse.json(
          { detail: "The payment gateway is temporarily unavailable. Please try again shortly." },
          { status: 502 }
        );
      }
    } else if (isPaymentSimulatorEnabled()) {
      redirect_url = simulatorUrl;
    } else {
      return NextResponse.json({ detail: "Online payment is not available right now." }, { status: 503 });
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
