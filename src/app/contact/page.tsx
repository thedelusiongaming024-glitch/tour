"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Atmosphere } from "@/components/Atmosphere";
import { Reveal } from "@/components/Reveal";
import { Icon } from "@/components/Icon";
import { siteName } from "@/data/site";

const officeInfo = [
  {
    icon: "mapPin",
    label: "Office",
    value: "House 14, Road 7, Banani, Dhaka 1213, Bangladesh",
  },
  {
    icon: "phone",
    label: "Phone",
    value: "+880 1XXX-XXXXXX",
  },
  {
    icon: "mail",
    label: "Email",
    value: "hello@atithi.example.com",
  },
  {
    icon: "clock",
    label: "Hours",
    value: "Every day, 9:00 AM – 9:00 PM (BST)",
  },
];

const tripTypes = [
  "Group Tour",
  "Private & Custom Trip",
  "Honeymoon Package",
  "Family Holiday",
  "Corporate Retreat",
  "Adventure & Trekking",
];

type Status = "idle" | "submitting" | "sent";

export default function ContactPage() {
  const [status, setStatus] = useState<Status>("idle");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    // Frontend-only mock submit — no backend wired up yet.
    setTimeout(() => setStatus("sent"), 900);
  }

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-10 pt-32 sm:px-6 sm:pt-40">
        <Atmosphere intensity={0.28} />
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <Reveal>
            <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-emerald-deep">
              <Icon name="mail" className="h-4 w-4" />
              Talk to us
            </span>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="mt-6 font-display text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl md:text-6xl">
              Let&apos;s plan your next journey
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
              Tell us where you want to go and when — a real person on our
              team will get back to you, usually within a few hours.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Form + Info */}
      <section className="px-4 pb-24 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.3fr_1fr]">
          {/* Form */}
          <Reveal>
            <div className="glass glass-sweep rounded-[2rem] p-6 sm:p-8">
              {status === "sent" ? (
                <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald/15 text-emerald">
                    <Icon name="check" className="h-7 w-7" />
                  </span>
                  <h2 className="font-display text-xl font-semibold text-ink">
                    Message sent
                  </h2>
                  <p className="max-w-sm text-sm leading-relaxed text-ink-soft">
                    Thanks for reaching out — someone from our team will
                    contact you shortly on the details you shared.
                  </p>
                  <button
                    type="button"
                    onClick={() => setStatus("idle")}
                    className="btn btn-glass mt-2"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="name"
                        className="text-xs font-semibold uppercase tracking-wider text-ink-faint"
                      >
                        Full name
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        placeholder="Your name"
                        className="mt-2 w-full rounded-2xl border border-white/70 bg-white/70 px-4 py-3 text-sm text-ink placeholder:text-ink-faint/70 outline-none transition-colors focus:border-emerald/50 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="phone"
                        className="text-xs font-semibold uppercase tracking-wider text-ink-faint"
                      >
                        Phone number
                      </label>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        required
                        placeholder="01XXX-XXXXXX"
                        className="mt-2 w-full rounded-2xl border border-white/70 bg-white/70 px-4 py-3 text-sm text-ink placeholder:text-ink-faint/70 outline-none transition-colors focus:border-emerald/50 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="text-xs font-semibold uppercase tracking-wider text-ink-faint"
                    >
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      placeholder="you@example.com"
                      className="mt-2 w-full rounded-2xl border border-white/70 bg-white/70 px-4 py-3 text-sm text-ink placeholder:text-ink-faint/70 outline-none transition-colors focus:border-emerald/50 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="tripType"
                      className="text-xs font-semibold uppercase tracking-wider text-ink-faint"
                    >
                      Trip type
                    </label>
                    <select
                      id="tripType"
                      name="tripType"
                      defaultValue=""
                      className="mt-2 w-full rounded-2xl border border-white/70 bg-white/70 px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-emerald/50 focus:bg-white"
                    >
                      <option value="" disabled>
                        Choose a trip type
                      </option>
                      {tripTypes.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="dates"
                        className="text-xs font-semibold uppercase tracking-wider text-ink-faint"
                      >
                        Preferred dates
                      </label>
                      <input
                        id="dates"
                        name="dates"
                        type="text"
                        placeholder="e.g. mid December"
                        className="mt-2 w-full rounded-2xl border border-white/70 bg-white/70 px-4 py-3 text-sm text-ink placeholder:text-ink-faint/70 outline-none transition-colors focus:border-emerald/50 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="travelers"
                        className="text-xs font-semibold uppercase tracking-wider text-ink-faint"
                      >
                        Travelers
                      </label>
                      <input
                        id="travelers"
                        name="travelers"
                        type="number"
                        min={1}
                        placeholder="2"
                        className="mt-2 w-full rounded-2xl border border-white/70 bg-white/70 px-4 py-3 text-sm text-ink placeholder:text-ink-faint/70 outline-none transition-colors focus:border-emerald/50 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="message"
                      className="text-xs font-semibold uppercase tracking-wider text-ink-faint"
                    >
                      Tell us more
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={4}
                      placeholder="Where do you want to go, and what would make it perfect?"
                      className="mt-2 w-full resize-none rounded-2xl border border-white/70 bg-white/70 px-4 py-3 text-sm text-ink placeholder:text-ink-faint/70 outline-none transition-colors focus:border-emerald/50 focus:bg-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    className="btn btn-emerald w-full disabled:opacity-70"
                  >
                    {status === "submitting" ? "Sending…" : "Send message"}
                  </button>
                  <p className="text-center text-xs text-ink-faint">
                    We&apos;ll never share your details. This form doesn&apos;t
                    send anywhere yet — it&apos;s a preview of the booking flow.
                  </p>
                </form>
              )}
            </div>
          </Reveal>

          {/* Info sidebar */}
          <div className="space-y-5">
            <Reveal delay={0.06}>
              <div className="glass glass-sweep rounded-3xl p-6">
                <h2 className="font-display text-lg font-semibold text-ink">
                  Reach us directly
                </h2>
                <div className="mt-5 space-y-4">
                  {officeInfo.map((info) => (
                    <div key={info.label} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald/10 text-emerald">
                        <Icon name={info.icon} className="h-4 w-4" />
                      </span>
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
                          {info.label}
                        </div>
                        <div className="text-sm font-medium text-ink">
                          {info.value}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.12}>
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald to-emerald-deep p-6 text-white">
                <Atmosphere intensity={0.2} />
                <div className="relative z-10">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                    <Icon name="whatsapp" className="h-5 w-5" />
                  </span>
                  <h2 className="mt-4 font-display text-lg font-semibold">
                    Faster on WhatsApp
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-emerald-50/90">
                    Message us directly for a same-day reply, e-tickets, and
                    your QR payment confirmations.
                  </p>
                  <Link
                    href="https://wa.me/8801XXXXXXXXX"
                    className="btn btn-gold mt-5 w-full !py-2.5"
                  >
                    Chat on WhatsApp
                  </Link>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.18}>
              <div className="glass glass-sweep rounded-3xl p-6">
                <h2 className="font-display text-base font-semibold text-ink">
                  {siteName} office hours
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  Our Dhaka office and phone lines are open every day —
                  including weekends and public holidays, since most trips
                  are booked outside standard office hours.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
