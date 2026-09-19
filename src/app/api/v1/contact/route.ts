import { NextResponse } from "next/server";
import { createInquiry } from "@/server/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, destination, dates, trip_type, travelers, message } = body;

    if (!name || !phone) {
      return NextResponse.json({ detail: "Name and phone number are required." }, { status: 400 });
    }

    const inquiry = await createInquiry({
      name,
      email: email || "",
      phone,
      destination: destination || "",
      dates: dates || "",
      trip_type: trip_type || "Group Tour",
      travelers: Math.max(1, Number(travelers) || 1),
      message: message || "",
    });

    return NextResponse.json(
      {
        status: "success",
        message: "Thank you for reaching out! A tour planner will contact you shortly.",
        inquiry_id: inquiry.id,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to process inquiry.";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
