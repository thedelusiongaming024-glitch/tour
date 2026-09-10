"use client";

import { useState } from "react";
import type { Tour } from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

interface BookingFormProps {
  tour: Tour;
  finalPrice: number;
  advanceAmount: number;
}

type Step = "form" | "submitting" | "redirecting" | "error" | "offline";

function formatBDT(amount: number): string {
  return "৳" + Math.round(amount).toLocaleString("en-BD");
}

export function BookingForm({ tour, finalPrice, advanceAmount }: BookingFormProps) {
  const [step, setStep] = useState<Step>(tour.id ? "form" : "offline");
  const [error, setError] = useState<string>("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [travelerCount, setTravelerCount] = useState(1);
  const [paymentPlan, setPaymentPlan] = useState<"full" | "partial">(
    tour.allowPartialPayment === false ? "full" : "partial"
  );
  const [departureId, setDepartureId] = useState(tour.departures?.[0]?.id ?? "");

  const dueOnTourDay = paymentPlan === "full" ? 0 : finalPrice - advanceAmount;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tour.id) return;
    setStep("submitting");
    setError("");

    try {
      const bookingRes = await fetch(`${API_BASE}/bookings/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tour_id: tour.id,
          departure_id: departureId || undefined,
          traveler_count: travelerCount,
          payment_plan: paymentPlan,
          customer_full_name: name,
          customer_phone_number: phone,
          customer_email: email,
        }),
      });

      if (!bookingRes.ok) {
        const body = await bookingRes.json().catch(() => ({}));
        throw new Error(
          typeof body === "object" ? Object.values(body).flat().join(" ") || "Could not create booking." : "Could not create booking."
        );
      }

      const booking = await bookingRes.json();

      const paymentRes = await fetch(`${API_BASE}/payments/initiate/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: booking.id,
          payment_type: paymentPlan === "full" ? "full" : "advance",
        }),
      });

      if (!paymentRes.ok) {
        throw new Error("Booking was created, but starting payment failed. Our team will contact you to complete it.");
      }

      const payment = await paymentRes.json();
      setStep("redirecting");
      if (payment.redirect_url) {
        window.location.href = payment.redirect_url;
      } else {
        throw new Error("Payment gateway did not return a redirect URL.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setStep("error");
    }
  }

  if (step === "offline") {
    return (
      <div className="rounded-2xl border border-white/40 bg-white/60 p-5 text-sm text-ink-soft backdrop-blur">
        Live booking isn&apos;t available in preview mode right now — please contact us directly to
        reserve this tour, or try again once the booking service is back online.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-white/40 bg-white/60 p-5 backdrop-blur">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-ink-soft">Full name</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-xl border border-white/60 bg-white/80 px-3 py-2 outline-none focus:border-emerald-deep"
            placeholder="Karim Hasan"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-ink-soft">Phone number</span>
          <input
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="rounded-xl border border-white/60 bg-white/80 px-3 py-2 outline-none focus:border-emerald-deep"
            placeholder="+8801XXXXXXXXX"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-ink-soft">Email (optional)</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-xl border border-white/60 bg-white/80 px-3 py-2 outline-none focus:border-emerald-deep"
          placeholder="you@example.com"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-ink-soft">Travelers</span>
          <input
            type="number"
            min={1}
            value={travelerCount}
            onChange={(e) => setTravelerCount(Math.max(1, Number(e.target.value)))}
            className="rounded-xl border border-white/60 bg-white/80 px-3 py-2 outline-none focus:border-emerald-deep"
          />
        </label>

        {tour.departures && tour.departures.length > 0 && (
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-ink-soft">Departure date</span>
            <select
              value={departureId}
              onChange={(e) => setDepartureId(e.target.value)}
              className="rounded-xl border border-white/60 bg-white/80 px-3 py-2 outline-none focus:border-emerald-deep"
            >
              {tour.departures.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.date} — {d.seatsRemaining} seats left
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {tour.allowPartialPayment !== false && (
        <div className="flex flex-col gap-2 text-sm">
          <span className="text-ink-soft">Payment</span>
          <div className="flex gap-3">
            <label className="flex items-center gap-2 rounded-xl border border-white/60 bg-white/80 px-3 py-2">
              <input type="radio" checked={paymentPlan === "partial"} onChange={() => setPaymentPlan("partial")} />
              Pay {formatBDT(advanceAmount)} advance now
            </label>
            <label className="flex items-center gap-2 rounded-xl border border-white/60 bg-white/80 px-3 py-2">
              <input type="radio" checked={paymentPlan === "full"} onChange={() => setPaymentPlan("full")} />
              Pay {formatBDT(finalPrice)} in full
            </label>
          </div>
          {dueOnTourDay > 0 && (
            <span className="text-xs text-ink-faint">
              Remaining {formatBDT(dueOnTourDay)} due on tour day via QR clearance or self-pay link.
            </span>
          )}
        </div>
      )}

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <button
        type="submit"
        disabled={step === "submitting" || step === "redirecting"}
        className="w-full rounded-xl bg-emerald-deep px-4 py-3 font-medium text-white transition hover:brightness-110 disabled:opacity-60"
      >
        {step === "submitting"
          ? "Creating your booking…"
          : step === "redirecting"
            ? "Redirecting to payment…"
            : `Continue to payment — ${formatBDT(paymentPlan === "full" ? finalPrice : advanceAmount)}`}
      </button>
    </form>
  );
}
