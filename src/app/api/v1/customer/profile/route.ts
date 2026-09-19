import { NextResponse } from "next/server";
import { getCustomerById, getCustomerByPhone, getCustomerBookings, updateCustomer } from "@/server/db";
import { getCustomerFromHeader, verifyJwt, CustomerJwtPayload } from "@/server/auth";

function resolveCustomer(request: Request) {
  // 1. Check Bearer Authorization header
  const authHeader = request.headers.get("authorization");
  const headerPayload = getCustomerFromHeader(authHeader);
  if (headerPayload?.customer_id) {
    const cust = getCustomerById(headerPayload.customer_id) || getCustomerByPhone(headerPayload.phone_number);
    if (cust) return cust;
  }

  // 2. Check Cookie
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/atithi_customer_token=([^;]+)/);
  if (match) {
    const token = match[1];
    const cookiePayload = verifyJwt<CustomerJwtPayload>(token);
    if (cookiePayload && cookiePayload.role === "customer" && cookiePayload.customer_id) {
      const cust = getCustomerById(cookiePayload.customer_id) || getCustomerByPhone(cookiePayload.phone_number);
      if (cust) return cust;
    }
  }

  // 3. Optional query param fallback for direct retrieval
  const url = new URL(request.url);
  const phone = url.searchParams.get("phone");
  if (phone) {
    const cust = getCustomerByPhone(phone);
    if (cust) return cust;
  }

  return null;
}

export async function GET(request: Request) {
  try {
    const customer = resolveCustomer(request);
    if (!customer) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in with your phone number." },
        { status: 401 }
      );
    }

    const bookings = getCustomerBookings(customer.phone_number);

    return NextResponse.json({
      customer,
      bookings,
      activities: customer.activities || [],
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch profile.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const customer = resolveCustomer(request);
    if (!customer) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in with your phone number." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { full_name, email } = body;

    const updated = await updateCustomer(customer.id, {
      full_name: typeof full_name === "string" ? full_name.trim() : undefined,
      email: typeof email === "string" ? email.trim() : undefined,
    });

    return NextResponse.json({
      success: true,
      customer: updated,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update profile.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
