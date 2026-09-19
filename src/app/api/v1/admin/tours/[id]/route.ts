import { NextResponse } from "next/server";
import { getAuthUserFromHeader } from "@/server/auth";
import { deleteTour, saveTour } from "@/server/db";

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const user = getAuthUserFromHeader(request.headers.get("Authorization"));
  if (!user || user.role !== "super_admin") {
    return NextResponse.json({ detail: "Super Admin privileges required." }, { status: 403 });
  }

  try {
    const { id } = await props.params;
    const body = await request.json();
    const tour = await saveTour({ ...body, id });
    return NextResponse.json(tour);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update tour.";
    return NextResponse.json({ detail: message }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const user = getAuthUserFromHeader(request.headers.get("Authorization"));
  if (!user || user.role !== "super_admin") {
    return NextResponse.json({ detail: "Super Admin privileges required." }, { status: 403 });
  }

  const { id } = await props.params;
  const ok = await deleteTour(id);
  if (!ok) {
    return NextResponse.json({ detail: "Tour not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true, id });
}
