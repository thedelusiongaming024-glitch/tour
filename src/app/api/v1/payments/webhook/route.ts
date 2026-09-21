import { NextResponse } from "next/server";
import { confirmPaymentSuccess, getPaymentByTranId } from "@/server/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tran_id, status = "VALID", val_id, card_type } = body;

    if (!tran_id) {
      return NextResponse.json({ detail: "tran_id is required." }, { status: 400 });
    }

    const payment = getPaymentByTranId(tran_id);
    if (!payment) {
      return NextResponse.json({ detail: "Transaction not found." }, { status: 404 });
    }

    if (status === "VALID" || status === "SUCCESS") {
      const result = await confirmPaymentSuccess(tran_id, val_id, card_type);
      return NextResponse.json({
        status: "success",
        message: "Payment confirmed successfully.",
        booking_reference: result.booking.reference,
        amount_paid: result.booking.amount_paid,
        amount_due: result.booking.amount_due,
      });
    } else {
      return NextResponse.json({
        status: "failed",
        message: "Payment transaction marked as failed or cancelled.",
      });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Payment processing failed.";
    return NextResponse.json({ detail: message }, { status: 400 });
  }
}
