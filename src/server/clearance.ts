import crypto from "node:crypto";

const CLEARANCE_SECRET = process.env.CLEARANCE_SECRET || "atithi-clearance-secret-salt-2026";
const TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days outer bound

interface ClearanceTokenData {
  booking_id: string;
  created_at: number;
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

export function generateClearanceToken(bookingId: string): string {
  const data: ClearanceTokenData = {
    booking_id: bookingId,
    created_at: Math.floor(Date.now() / 1000),
  };
  const payload = base64UrlEncode(JSON.stringify(data));
  const sig = crypto
    .createHmac("sha256", CLEARANCE_SECRET)
    .update(payload)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${payload}.${sig}`;
}

export function verifyClearanceToken(
  token: string,
  expectedBookingId: string,
  tokenExpiresAtIso?: string
): { valid: true; booking_id: string } | { valid: false; reason: "bad_signature" | "expired" | "mismatch" } {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) {
      return { valid: false, reason: "bad_signature" };
    }

    const [payload, sig] = parts;
    const expectedSig = crypto
      .createHmac("sha256", CLEARANCE_SECRET)
      .update(payload)
      .digest("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    if (sig !== expectedSig) {
      return { valid: false, reason: "bad_signature" };
    }

    const data = JSON.parse(base64UrlDecode(payload)) as ClearanceTokenData;
    if (data.booking_id !== expectedBookingId) {
      return { valid: false, reason: "mismatch" };
    }

    const now = Math.floor(Date.now() / 1000);
    // Outer max age check
    if (now - data.created_at > TOKEN_MAX_AGE_SECONDS) {
      return { valid: false, reason: "expired" };
    }

    // Specific tour departure expiration check
    if (tokenExpiresAtIso) {
      const expTime = new Date(tokenExpiresAtIso).getTime();
      if (!isNaN(expTime) && Date.now() > expTime) {
        return { valid: false, reason: "expired" };
      }
    }

    return { valid: true, booking_id: data.booking_id };
  } catch {
    return { valid: false, reason: "bad_signature" };
  }
}
