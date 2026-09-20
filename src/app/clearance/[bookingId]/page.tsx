"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Icon } from "@/components/Icon";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

interface ClearanceBooking {
  booking_reference: string;
  customer_name: string;
  tour_title: string;
  amount_due: string;
  is_cleared: boolean;
  departure_date?: string;
  traveler_count?: number;
  selected_seats?: string[];
  pickup_point?: string;
}

interface ResolveResponse {
  status: "verified" | "due_pending";
  message: string;
  amount_due?: string;
  booking: ClearanceBooking;
}

type ViewState =
  | { kind: "loading" }
  | { kind: "expired" }
  | { kind: "invalid" }
  | { kind: "error"; message: string }
  | { kind: "resolved"; data: ResolveResponse };

function formatBDT(amount: string | number): string {
  return "৳" + Math.round(Number(amount)).toLocaleString("en-BD");
}

export default function ClearancePage() {
  const params = useParams<{ bookingId: string }>();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [state, setState] = useState<ViewState>({ kind: "loading" });
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    async function resolve() {
      try {
        const res = await fetch(
          `${API_BASE}/clearance/${params.bookingId}?token=${encodeURIComponent(token)}`
        );
        if (res.status === 410) {
          setState({ kind: "expired" });
          return;
        }
        if (res.status === 400) {
          setState({ kind: "invalid" });
          return;
        }
        if (!res.ok) {
          setState({ kind: "error", message: "Could not verify this booking right now." });
          return;
        }
        const data = (await res.json()) as ResolveResponse;
        setState({ kind: "resolved", data });
      } catch {
        setState({ kind: "error", message: "Could not reach the server. Check your connection and reload." });
      }
    }
    resolve();
  }, [params.bookingId, token]);

  async function handlePay() {
    setPaying(true);
    try {
      // endpoint is authorized by the signed clearance token (it's
      // AllowAny — there's no customer login), not by anything else in
      // the request. `token` was already in scope from the page's query
      // params but wasn't being sent, so every "Pay now" tap failed with
      // 400 "Invalid or missing clearance token."
      // The token was already parsed off the booking pass URL
      // in resolveBooking; it just wasn't being kept around in state for
      // this second request to use.
      const res = await fetch(`${API_BASE}/clearance/${params.bookingId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "customer_self_pay", token }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.redirect_url) {
        window.location.href = data.redirect_url;
      }
    } catch {
      setPaying(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-50 to-white px-4 py-16">
      <div className="w-full max-w-md rounded-3xl border border-white/60 bg-white/80 p-8 text-center shadow-xl backdrop-blur">
        <div className="mb-6 flex flex-col items-center">
          <div className="h-12 w-12 rounded-2xl bg-white border border-emerald/20 p-1 shadow-xs mb-2">
            <img src="/images/logo-badge.png" alt="Savar Tour Lover" className="h-full w-full object-contain" />
          </div>
          <span className="font-display text-lg font-bold text-ink">Savar Tour Lover</span>
          <span className="text-xs font-semibold text-emerald-700">আপনার স্বপ্ন উড়তে দিন</span>
        </div>

        {state.kind === "loading" && (
          <>
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-emerald-deep/20 border-t-emerald-deep" />
            <p className="text-ink-soft">Verifying your booking…</p>
          </>
        )}

        {state.kind === "expired" && (
          <>
            <Icon name="clock" className="mx-auto mb-4 h-10 w-10 text-amber-500" />
            <h1 className="font-display text-xl font-semibold text-ink">This link has expired</h1>
            <p className="mt-2 text-sm text-ink-soft">
              Please contact our team directly, or reach out to your tour host or support team.
            </p>
          </>
        )}

        {state.kind === "invalid" && (
          <>
            <Icon name="shield" className="mx-auto mb-4 h-10 w-10 text-rose-500" />
            <h1 className="font-display text-xl font-semibold text-ink">Invalid clearance link</h1>
            <p className="mt-2 text-sm text-ink-soft">This link doesn&apos;t match a valid booking.</p>
          </>
        )}

        {state.kind === "error" && (
          <>
            <Icon name="shield" className="mx-auto mb-4 h-10 w-10 text-rose-500" />
            <p className="text-sm text-ink-soft">{state.message}</p>
          </>
        )}

        {state.kind === "resolved" && state.data.status === "verified" && (
          <>
            <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-deep/10">
              <Icon name="check" className="h-8 w-8 text-emerald-deep" />
            </span>
            <h1 className="font-display text-xl font-semibold text-ink">Booking Confirmed — Fully Paid</h1>
            <div className="mt-4 space-y-1 text-sm text-ink-soft">
              <p className="font-semibold text-ink text-base">{state.data.booking.tour_title}</p>
              <p className="font-mono text-xs text-slate-500">{state.data.booking.booking_reference}</p>
              <p>{state.data.booking.customer_name}</p>
              {state.data.booking.departure_date && (
                <p className="text-xs">📅 Departure: {state.data.booking.departure_date.slice(0, 10)}</p>
              )}
              {state.data.booking.selected_seats && state.data.booking.selected_seats.length > 0 && (
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
                  💺 Assigned Seats: {state.data.booking.selected_seats.join(", ")}
                </div>
              )}
              {state.data.booking.pickup_point && (
                <div className="mt-1.5 flex items-center justify-center gap-1.5 text-xs text-slate-700 font-medium">
                  <span>📍 Pick-up Point:</span>
                  <span className="font-semibold text-slate-900">{state.data.booking.pickup_point}</span>
                </div>
              )}
            </div>
          </>
        )}

        {state.kind === "resolved" && state.data.status === "due_pending" && (
          <>
            <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
              <Icon name="receipt" className="h-8 w-8 text-amber-600" />
            </span>
            <h1 className="font-display text-xl font-semibold text-ink">Balance Due</h1>
            <div className="mt-4 space-y-1 text-sm text-ink-soft">
              <p className="font-semibold text-ink text-base">{state.data.booking.tour_title}</p>
              <p className="font-mono text-xs text-slate-500">{state.data.booking.booking_reference}</p>
              <p>{state.data.booking.customer_name}</p>
              {state.data.booking.departure_date && (
                <p className="text-xs">📅 Departure: {state.data.booking.departure_date.slice(0, 10)}</p>
              )}
              {state.data.booking.selected_seats && state.data.booking.selected_seats.length > 0 && (
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
                  💺 Assigned Seats: {state.data.booking.selected_seats.join(", ")}
                </div>
              )}
              {state.data.booking.pickup_point && (
                <div className="mt-1.5 flex items-center justify-center gap-1.5 text-xs text-slate-700 font-medium">
                  <span>📍 Pick-up Point:</span>
                  <span className="font-semibold text-slate-900">{state.data.booking.pickup_point}</span>
                </div>
              )}
            </div>
            <p className="mt-4 font-display text-3xl font-semibold text-ink">
              {formatBDT(state.data.amount_due ?? state.data.booking.amount_due)}
            </p>
            <button
              onClick={handlePay}
              disabled={paying}
              className="mt-6 w-full rounded-xl bg-emerald-deep px-4 py-3 font-medium text-white transition hover:brightness-110 disabled:opacity-60"
            >
              {paying ? "Redirecting to payment…" : "Pay now"}
            </button>
          </>
        )}
      </div>
    </main>
  );
}
