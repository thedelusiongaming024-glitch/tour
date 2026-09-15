import { NextResponse } from "next/server";
import { getAuthUserFromHeader } from "@/server/auth";
import { deleteBlogPost, saveBlogPost } from "@/server/db";

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
    const post = saveBlogPost({ ...body, id });
    return NextResponse.json(post);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update blog post.";
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
  const ok = deleteBlogPost(id);
  if (!ok) {
    return NextResponse.json({ detail: "Blog post not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true, id });
}
