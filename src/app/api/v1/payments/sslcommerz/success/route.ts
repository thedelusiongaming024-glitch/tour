import { NextResponse } from "next/server";
import { confirmPaymentSuccess, getPaymentByTranId, getBookingById } from "@/server/db";
import { validateSSLCommerzPayment } from "@/lib/sslcommerz";

export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  let tran_id = "";
  let val_id = "";
  let card_type = "SSLCommerz";
  let value_a = "";
  let value_b = "";

  try {
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      tran_id = (formData.get("tran_id") as string) || "";
      val_id = (formData.get("val_id") as string) || "";
      card_type = (formData.get("card_type") as string) || (formData.get("card_brand") as string) || "SSLCommerz";
      value_a = (formData.get("value_a") as string) || "";
      value_b = (formData.get("value_b") as string) || "";
    } else {
      const body = await request.json().catch(() => ({}));
      tran_id = body.tran_id || "";
      val_id = body.val_id || "";
      card_type = body.card_type || body.card_brand || "SSLCommerz";
      value_a = body.value_a || "";
      value_b = body.value_b || "";
    }

    if (!tran_id) {
      return NextResponse.redirect(`${origin}/payment-result?status=fail`, 303);
    }

    const payment = getPaymentByTranId(tran_id);
    const bookingId = payment?.booking_id || value_a;
    const booking = bookingId ? getBookingById(bookingId) : null;
    let reference = booking?.reference || value_b || "";

    // If already confirmed by IPN webhook, redirect directly
    if (payment && payment.status === "success") {
      return NextResponse.redirect(
        `${origin}/payment-result?status=success&reference=${encodeURIComponent(reference)}`,
        303
      );
    }

    // Server-to-server order validation with SSLCommerz
    if (val_id) {
      const validated = await validateSSLCommerzPayment(val_id);
      if (validated.status !== "VALID" && validated.status !== "VALIDATED") {
        console.error("SSLCommerz order validation rejected:", validated);
        return NextResponse.redirect(
          `${origin}/payment-result?status=fail&reference=${encodeURIComponent(reference)}`,
          303
        );
      }
      if (validated.card_type) {
        card_type = validated.card_type;
      }
      if (!reference && validated.raw?.value_b) {
        reference = validated.raw.value_b;
      }
    }

    // Confirm payment in local DB and sync to Supabase with fallback recovery
    const result = await confirmPaymentSuccess(tran_id, val_id, card_type, {
      bookingId: bookingId || undefined,
      bookingRef: reference || undefined,
    });

    if (result.booking?.reference) {
      reference = result.booking.reference;
    }

    return NextResponse.redirect(
      `${origin}/payment-result?status=success&reference=${encodeURIComponent(reference)}`,
      303
    );
  } catch (err: unknown) {
    console.error("Error handling SSLCommerz success callback:", err);
    return NextResponse.redirect(`${origin}/payment-result?status=fail`, 303);
  }
}
