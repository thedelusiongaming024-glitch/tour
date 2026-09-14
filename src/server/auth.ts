import crypto from "node:crypto";
import type { DbStaffUser, StaffRole } from "./types";

const JWT_SECRET = process.env.JWT_SECRET || "atithi-super-secret-jwt-signing-key-2026";
const ACCESS_TOKEN_EXPIRY_SECONDS = 12 * 60 * 60; // 12 hours
const REFRESH_TOKEN_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7 days

export interface JwtPayload {
  user_id: string;
  username: string;
  role: StaffRole;
  phone_number: string | null;
  token_type: "access" | "refresh";
  exp: number;
  iat: number;
  [key: string]: unknown;
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return Buffer.from(base64, "base64").toString("utf-8");
}

function signJwt(payload: Record<string, unknown>, secret: string): string {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${data}.${signature}`;
}

export function verifyJwt<T = JwtPayload>(token: string, secret: string = JWT_SECRET): T | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, signature] = parts;
    const data = `${encodedHeader}.${encodedPayload}`;

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(data)
      .digest("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    if (signature !== expectedSignature) return null;

    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as JwtPayload;
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null;
    }

    return payload as unknown as T;
  } catch {
    return null;
  }
}

export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const s = salt || crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, s, 10000, 64, "sha512").toString("hex");
  return { hash, salt: s };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const computed = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hash));
}

export function generateTokens(user: DbStaffUser): { access: string; refresh: string } {
  const now = Math.floor(Date.now() / 1000);

  const accessPayload: JwtPayload = {
    user_id: user.id,
    username: user.username,
    role: user.role,
    phone_number: user.phone_number,
    token_type: "access",
    iat: now,
    exp: now + ACCESS_TOKEN_EXPIRY_SECONDS,
  };

  const refreshPayload: JwtPayload = {
    user_id: user.id,
    username: user.username,
    role: user.role,
    phone_number: user.phone_number,
    token_type: "refresh",
    iat: now,
    exp: now + REFRESH_TOKEN_EXPIRY_SECONDS,
  };

  return {
    access: signJwt(accessPayload, JWT_SECRET),
    refresh: signJwt(refreshPayload, JWT_SECRET),
  };
}

export function getAuthUserFromHeader(authHeader: string | null): JwtPayload | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.substring(7).trim();
  const payload = verifyJwt<JwtPayload>(token);
  if (!payload || payload.token_type !== "access") return null;
  return payload;
}
