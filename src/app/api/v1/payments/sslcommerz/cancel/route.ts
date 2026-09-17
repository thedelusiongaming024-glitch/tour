import { NextResponse } from "next/server";
import { getPaymentByTranId, getBookingById } from "@/server/db";

export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  let tran_id = "";

  try {
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      tran_id = (formData.get("tran_id") as string) || "";
    } else {
      const body = await request.json().catch(() => ({}));
      tran_id = body.tran_id || "";
    }

    if (tran_id) {
      const payment = getPaymentByTranId(tran_id);
      if (payment) {
        const booking = getBookingById(payment.booking_id);
        const reference = booking?.reference || "";
        return NextResponse.redirect(
          `${origin}/payment-result?status=cancel&reference=${encodeURIComponent(reference)}`,
          303
        );
      }
    }

    return NextResponse.redirect(`${origin}/payment-result?status=cancel`, 303);
  } catch (err: unknown) {
    console.error("Error handling SSLCommerz cancel callback:", err);
    return NextResponse.redirect(`${origin}/payment-result?status=cancel`, 303);
  }
}
