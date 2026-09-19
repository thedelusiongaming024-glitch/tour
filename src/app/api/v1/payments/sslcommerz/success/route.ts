import { NextResponse } from "next/server";
import { confirmPaymentSuccess, getPaymentByTranId, getBookingById } from "@/server/db";
import { validateSSLCommerzPayment } from "@/lib/sslcommerz";

export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  let tran_id = "";
  let val_id = "";
  let card_type = "SSLCommerz";

  try {
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      tran_id = (formData.get("tran_id") as string) || "";
      val_id = (formData.get("val_id") as string) || "";
      card_type = (formData.get("card_type") as string) || (formData.get("card_brand") as string) || "SSLCommerz";
    } else {
      const body = await request.json().catch(() => ({}));
      tran_id = body.tran_id || "";
      val_id = body.val_id || "";
      card_type = body.card_type || body.card_brand || "SSLCommerz";
    }

    if (!tran_id) {
      return NextResponse.redirect(`${origin}/payment-result?status=fail`, 303);
    }

    const payment = getPaymentByTranId(tran_id);
    if (!payment) {
      return NextResponse.redirect(`${origin}/payment-result?status=fail`, 303);
    }

    const booking = getBookingById(payment.booking_id);
    const reference = booking?.reference || "";

    // If already confirmed by IPN webhook, redirect directly
    if (payment.status === "success") {
      return NextResponse.redirect(
        `${origin}/payment-result?status=success&reference=${encodeURIComponent(reference)}`,
        303
      );
    }

    // Strict server-to-server order validation with SSLCommerz
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
    }

    // Confirm payment in local DB and sync to Supabase
    await confirmPaymentSuccess(tran_id, val_id, card_type);

    return NextResponse.redirect(
      `${origin}/payment-result?status=success&reference=${encodeURIComponent(reference)}`,
      303
    );
  } catch (err: unknown) {
    console.error("Error handling SSLCommerz success callback:", err);
    return NextResponse.redirect(`${origin}/payment-result?status=fail`, 303);
  }
}
