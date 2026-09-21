import { NextResponse } from "next/server";
import { generateTokens, verifyPassword } from "@/server/auth";
import { findStaffByUsername } from "@/server/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ detail: "Username and password are required." }, { status: 400 });
    }

    const user = findStaffByUsername(username);
    if (!user) {
      return NextResponse.json({ detail: "Invalid username or password." }, { status: 401 });
    }

    const valid = verifyPassword(password, user.password_hash, user.salt);
    if (!valid) {
      return NextResponse.json({ detail: "Invalid username or password." }, { status: 401 });
    }

    const tokens = generateTokens(user);
    return NextResponse.json(tokens);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Authentication error.";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
