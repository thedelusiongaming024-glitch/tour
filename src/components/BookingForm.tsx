"use client";

import { useState } from "react";
import type { Tour } from "@/lib/types";
import { DEFAULT_PICKUP_POINTS } from "@/lib/pickupPoints";
import { BusSeatSelector } from "@/components/BusSeatSelector";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

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
  const availablePickupPoints =
    Array.isArray(tour.pickupPoints) && tour.pickupPoints.length > 0
      ? tour.pickupPoints
      : DEFAULT_PICKUP_POINTS;

  const [step, setStep] = useState<Step>(tour.id ? "form" : "offline");
  const [error, setError] = useState<string>("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [departureId, setDepartureId] = useState(tour.departures?.[0]?.id ?? "");
  const [pickupPoint, setPickupPoint] = useState<string>(availablePickupPoints[0] || "");
  const [isCustomPickup, setIsCustomPickup] = useState<boolean>(false);
  const [customPickupText, setCustomPickupText] = useState<string>("");
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [paymentPlan, setPaymentPlan] = useState<"full" | "partial">(
    tour.allowPartialPayment === false ? "full" : "partial"
  );

  const selectedDeparture =
    tour.departures?.find((d) => d.id === departureId) || tour.departures?.[0];
  const departureTotalSeats = selectedDeparture?.totalSeats || tour.capacity || 40;
  const departureBookedSeats = selectedDeparture?.bookedSeats || [];

  const travelerCount = selectedSeats.length > 0 ? selectedSeats.length : 1;
  const totalFinalPrice = finalPrice * travelerCount;
  const totalAdvanceAmount = advanceAmount * travelerCount;
  const dueOnTourDay = paymentPlan === "full" ? 0 : totalFinalPrice - totalAdvanceAmount;

  function handleDepartureChange(newId: string) {
    setDepartureId(newId);
    setSelectedSeats([]); // reset seats for new date
    setError("");
  }

  function handleSeatsChange(newSeats: string[]) {
    setSelectedSeats(newSeats);
    if (error) setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tour.id) return;

    if (selectedSeats.length === 0) {
      setError("Please select at least 1 seat on the bus layout before proceeding.");
      return;
    }

    const finalPickupPoint = isCustomPickup ? customPickupText.trim() : pickupPoint;
    if (isCustomPickup && !finalPickupPoint) {
      setError("Please specify your desired pick-up location.");
      return;
    }

    setStep("submitting");
    setError("");

    try {
      const bookingRes = await fetch(`${API_BASE}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tour_id: tour.id,
          departure_id: departureId || undefined,
          traveler_count: selectedSeats.length,
          payment_plan: paymentPlan,
          customer_full_name: name,
          customer_phone_number: phone,
          customer_email: email,
          pickup_point: finalPickupPoint,
          selected_seats: selectedSeats,
        }),
      });

      if (!bookingRes.ok) {
        const body = await bookingRes.json().catch(() => ({}));
        throw new Error(
          typeof body === "object"
            ? Object.values(body).flat().join(" ") || "Could not create booking."
            : "Could not create booking."
        );
      }

      const booking = await bookingRes.json();

      if (booking.customer_token) {
        try {
          localStorage.setItem("atithi_customer_token", booking.customer_token);
          if (booking.customer) {
            localStorage.setItem("atithi_customer", JSON.stringify(booking.customer));
          }
          document.cookie = `atithi_customer_token=${booking.customer_token}; path=/; max-age=2592000; SameSite=Lax`;
        } catch {}
      }

      const paymentRes = await fetch(`${API_BASE}/payments/initiate`, {
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
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-white/40 bg-white/60 p-5 backdrop-blur shadow-sm">
      {/* Traveler contact info */}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-ink-soft font-medium">Full name</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-xl border border-white/60 bg-white/80 px-3 py-2 outline-none focus:border-emerald-deep"
            placeholder="Karim Hasan"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-ink-soft font-medium">Phone number</span>
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
        <span className="text-ink-soft font-medium">Email (optional)</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-xl border border-white/60 bg-white/80 px-3 py-2 outline-none focus:border-emerald-deep"
          placeholder="you@example.com"
        />
      </label>

      {/* Departure date selection */}
      {tour.departures && tour.departures.length > 0 && (
        <label className="flex flex-col gap-1 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-ink-soft font-medium">Departure Date</span>
            {selectedDeparture && (
              <span className="text-xs text-emerald-700 font-medium">
                {selectedDeparture.seatsRemaining} available seats
              </span>
            )}
          </div>
          <select
            value={departureId}
            onChange={(e) => handleDepartureChange(e.target.value)}
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

      {/* Boarding Pick-up Point Selection */}
      <div className="flex flex-col gap-1.5 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-ink-soft font-medium flex items-center gap-1.5">
            Pick-up Point (বোর্ডিং পয়েন্ট)
          </span>
          <span className="text-[11px] text-emerald-700 font-medium">
            Pick Your Location.
          </span>
        </div>
        <select
          value={isCustomPickup ? "__custom__" : pickupPoint}
          onChange={(e) => {
            if (e.target.value === "__custom__") {
              setIsCustomPickup(true);
            } else {
              setIsCustomPickup(false);
              setPickupPoint(e.target.value);
            }
          }}
          className="rounded-xl border border-white/60 bg-white/80 px-3 py-2 outline-none focus:border-emerald-deep text-slate-800 text-sm font-medium"
        >
          {availablePickupPoints.map((pt) => (
            <option key={pt} value={pt}>
              📍 {pt}
            </option>
          ))}
          <option value="__custom__">➕ Other Location (Custom Pick-up Spot)</option>
        </select>

        {isCustomPickup && (
          <input
            type="text"
            required
            value={customPickupText}
            onChange={(e) => setCustomPickupText(e.target.value)}
            placeholder="e.g. Nabinagar Bypass, Hemayetpur, or specify your location"
            className="rounded-xl border border-white/60 bg-white/80 px-3 py-2 outline-none focus:border-emerald-deep text-slate-800 text-sm"
          />
        )}
      </div>

      {/* Interactive Bus Seat Selection */}
      <div className="rounded-xl border border-white/70 bg-white/70 p-3 sm:p-4 backdrop-blur-xs">
        <div className="mb-2 text-center">
          <h4 className="text-sm font-semibold text-slate-800">
            Select Your Bus Seats
          </h4>
          <p className="text-xs text-slate-500">
            Pick your preferred seat(s) on the bus layout below.
          </p>
        </div>

        <BusSeatSelector
          totalSeats={departureTotalSeats}
          bookedSeats={departureBookedSeats}
          selectedSeats={selectedSeats}
          onSeatsChange={handleSeatsChange}
          disabled={step === "submitting" || step === "redirecting"}
        />
      </div>

      {/* Pricing and seats breakdown */}
      {selectedSeats.length > 0 && (
        <div className="rounded-xl bg-slate-50/90 p-3 border border-slate-200/80 text-xs space-y-1.5 animate-in fade-in">
          <div className="flex justify-between text-slate-600">
            <span>Selected Seats ({selectedSeats.length}):</span>
            <span className="font-semibold text-emerald-800">{selectedSeats.join(", ")}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Price per seat:</span>
            <span>{formatBDT(finalPrice)}</span>
          </div>
          <div className="flex justify-between text-slate-900 font-semibold border-t border-slate-200 pt-1">
            <span>Total Tour Cost:</span>
            <span>{formatBDT(totalFinalPrice)}</span>
          </div>
        </div>
      )}

      {/* Payment plan selection */}
      {tour.allowPartialPayment !== false && (
        <div className="flex flex-col gap-2 text-sm">
          <span className="text-ink-soft font-medium">Payment Option</span>
          <div className="grid gap-2 sm:grid-cols-2">
            <label
              className={`flex items-center gap-2 rounded-xl border p-3 cursor-pointer transition-all ${
                paymentPlan === "partial"
                  ? "border-emerald-600 bg-emerald-50/60 shadow-xs"
                  : "border-white/60 bg-white/80"
              }`}
            >
              <input
                type="radio"
                name="paymentPlan"
                checked={paymentPlan === "partial"}
                onChange={() => setPaymentPlan("partial")}
              />
              <div>
                <div className="font-semibold text-ink">Pay {formatBDT(totalAdvanceAmount)}</div>
                <div className="text-[11px] text-ink-soft">Advance confirmation now</div>
              </div>
            </label>
            <label
              className={`flex items-center gap-2 rounded-xl border p-3 cursor-pointer transition-all ${
                paymentPlan === "full"
                  ? "border-emerald-600 bg-emerald-50/60 shadow-xs"
                  : "border-white/60 bg-white/80"
              }`}
            >
              <input
                type="radio"
                name="paymentPlan"
                checked={paymentPlan === "full"}
                onChange={() => setPaymentPlan("full")}
              />
              <div>
                <div className="font-semibold text-ink">Pay {formatBDT(totalFinalPrice)}</div>
                <div className="text-[11px] text-ink-soft">Full payment in one step</div>
              </div>
            </label>
          </div>
          {dueOnTourDay > 0 && selectedSeats.length > 0 && (
            <span className="text-xs text-ink-faint">
              Remaining {formatBDT(dueOnTourDay)} due on tour day via online self-pay link or cash to host.
            </span>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700 font-medium">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={step === "submitting" || step === "redirecting"}
        className="w-full rounded-xl bg-emerald-deep px-4 py-3 font-medium text-white transition hover:brightness-110 disabled:opacity-60 shadow-xs"
      >
        {step === "submitting"
          ? "Creating your booking…"
          : step === "redirecting"
            ? "Redirecting to payment…"
            : selectedSeats.length === 0
              ? "Select seats to continue"
              : `Continue to payment — ${formatBDT(paymentPlan === "full" ? totalFinalPrice : totalAdvanceAmount)}`}
      </button>
    </form>
  );
}
