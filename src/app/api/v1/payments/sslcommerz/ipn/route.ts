import { NextResponse } from "next/server";
import { confirmPaymentSuccess, getPaymentByTranId } from "@/server/db";
import { validateSSLCommerzPayment } from "@/lib/sslcommerz";

export async function POST(request: Request) {
  let tran_id = "";
  let val_id = "";
  let status = "";
  let card_type = "SSLCommerz";

  try {
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      tran_id = (formData.get("tran_id") as string) || "";
      val_id = (formData.get("val_id") as string) || "";
      status = (formData.get("status") as string) || "";
      card_type = (formData.get("card_type") as string) || (formData.get("card_brand") as string) || "SSLCommerz";
    } else {
      const body = await request.json().catch(() => ({}));
      tran_id = body.tran_id || "";
      val_id = body.val_id || "";
      status = body.status || "";
      card_type = body.card_type || body.card_brand || "SSLCommerz";
    }

    if (!tran_id) {
      return NextResponse.json({ detail: "tran_id is required." }, { status: 400 });
    }

    const payment = getPaymentByTranId(tran_id);
    if (!payment) {
      return NextResponse.json({ detail: "Transaction not found." }, { status: 404 });
    }

    // Idempotent: if already confirmed by the browser redirect, acknowledge IPN
    if (payment.status === "success") {
      return NextResponse.json({ status: "ALREADY_CONFIRMED" });
    }

    if (status === "VALID" || status === "SUCCESS" || val_id) {
      if (val_id) {
        const validated = await validateSSLCommerzPayment(val_id);
        if (validated.status !== "VALID" && validated.status !== "VALIDATED") {
          console.error("IPN SSLCommerz validation failed:", validated);
          return NextResponse.json({ status: "INVALID_TRANSACTION" }, { status: 400 });
        }
        if (validated.card_type) card_type = validated.card_type;
      }

      await confirmPaymentSuccess(tran_id, val_id, card_type);
      return NextResponse.json({ status: "CONFIRMED" });
    }

    return NextResponse.json({ status: "FAILED_OR_CANCELLED" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "IPN processing error";
    console.error("SSLCommerz IPN error:", err);
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
