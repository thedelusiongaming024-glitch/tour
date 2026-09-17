import { NextResponse } from "next/server";
import { getAuthUserFromHeader } from "@/server/auth";
import { getAllBookingsAdmin, updateBookingStatus } from "@/server/db";

export async function GET(request: Request) {
  const user = getAuthUserFromHeader(request.headers.get("Authorization"));
  if (!user || user.role !== "super_admin") {
    return NextResponse.json({ detail: "Super Admin privileges required." }, { status: 403 });
  }

  const bookings = getAllBookingsAdmin();
  return NextResponse.json({ results: bookings });
}

export async function PATCH(request: Request) {
  const user = getAuthUserFromHeader(request.headers.get("Authorization"));
  if (!user || user.role !== "super_admin") {
    return NextResponse.json({ detail: "Super Admin privileges required." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, status } = body;
    if (!id || !status) {
      return NextResponse.json({ detail: "id and status are required." }, { status: 400 });
    }

    const updated = await updateBookingStatus(id, status);
    if (!updated) {
      return NextResponse.json({ detail: "Booking not found." }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update booking.";
    return NextResponse.json({ detail: message }, { status: 400 });
  }
}
