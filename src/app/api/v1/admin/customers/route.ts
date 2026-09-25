import { NextResponse } from "next/server";
import { getAuthUserFromHeader } from "@/server/auth";
import { getAllCustomers } from "@/server/db";

export async function GET(request: Request) {
  const user = getAuthUserFromHeader(request.headers.get("Authorization"));
  if (!user) {
    return NextResponse.json({ detail: "Staff authentication required." }, { status: 401 });
  }
  if (user.role !== "super_admin") {
    return NextResponse.json({ detail: "Super Admin privileges required." }, { status: 403 });
  }

  const customers = getAllCustomers();
  return NextResponse.json({ count: customers.length, results: customers });
}
