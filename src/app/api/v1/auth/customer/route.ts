import { NextResponse } from "next/server";
import { getCustomerByPhone, normalizePhoneNumber } from "@/server/db";
import { generateCustomerToken } from "@/server/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone_number } = body;

    if (!phone_number || typeof phone_number !== "string" || !phone_number.trim()) {
      return NextResponse.json(
        { error: "Phone number is required." },
        { status: 400 }
      );
    }

    const normalized = normalizePhoneNumber(phone_number);
    const customer = getCustomerByPhone(normalized || phone_number);

    if (!customer) {
      return NextResponse.json(
        {
          error: "No account found with this phone number. Please check the number or book a tour to get started.",
          notFound: true,
        },
        { status: 404 }
      );
    }

    customer.last_login_at = new Date().toISOString();
    const token = generateCustomerToken(customer);

    const response = NextResponse.json(
      {
        success: true,
        customer,
        token,
      },
      { status: 200 }
    );

    response.cookies.set("atithi_customer_token", token, {
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
      sameSite: "lax",
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to sign in.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
