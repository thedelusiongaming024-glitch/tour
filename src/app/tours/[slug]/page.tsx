import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Atmosphere } from "@/components/Atmosphere";
import { Reveal } from "@/components/Reveal";
import { Stagger, StaggerItem } from "@/components/Stagger";
import { SceneBackdrop } from "@/components/SceneBackdrop";
import { BookingForm } from "@/components/BookingForm";
import { Icon } from "@/components/Icon";
import { fetchDestination, fetchTour } from "@/lib/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tour = await fetchTour(slug);
  if (!tour) return { title: "Tour not found" };
  return {
    title: tour.title,
    description: tour.summary,
  };
}

function formatBDT(amount: number): string {
  return "৳" + amount.toLocaleString("en-BD");
}

export default async function TourPage({ params }: PageProps) {
  const { slug } = await params;
  const tour = await fetchTour(slug);
  if (!tour) notFound();

  const destination = tour.destinationSlug ? await fetchDestination(tour.destinationSlug) : null;
  const original = tour.startingPrice;
  const final = Math.max(0, original - tour.discount);
  const advance = Math.round((final * tour.advancePercent) / 100);
  const remaining = final - advance;
  const dueLabel = tour.advancePercent >= 100 ? "Fully paid at booking" : `Due on tour day: ${formatBDT(remaining)}`;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-10 pt-32 sm:px-6 sm:pt-40">
        <Atmosphere intensity={0.25} />
        <div className="relative z-10 mx-auto max-w-6xl">
          <Reveal>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Link
                href="/tours"
                className="inline-flex items-center gap-1.5 font-medium text-ink-faint transition-colors hover:text-emerald"
              >
                <Icon name="arrow" className="h-4 w-4 -scale-x-100" />
                Tours
              </Link>
              {destination && (
                <>
                  <span className="text-ink-faint/50">/</span>
                  <Link
                    href={`/destinations/${destination.slug}`}
                    className="font-medium text-ink-faint transition-colors hover:text-emerald"
                  >
                    {destination.name}
                  </Link>
                </>
              )}
            </div>
          </Reveal>

          <Reveal delay={0.06}>
            <div className="mt-4 flex flex-wrap items-start justify-between gap-6">
              <div className="max-w-2xl">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="rounded-full bg-ink/80 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
                    {tour.category}
                  </span>
                  <span className="rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-gold">
                    {tour.duration}
                  </span>
                </div>
                <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
                  {tour.title}
                </h1>
                <p className="mt-4 text-lg leading-relaxed text-ink-soft">
                  {tour.summary}
                </p>
              </div>

              {/* Price card */}
              <div className="glass glass-sweep w-full max-w-sm rounded-3xl p-6">
                <div className="flex items-baseline gap-2">
                  {tour.discount > 0 ? (
                    <>
                      <span className="text-sm text-ink-faint line-through">
                        {formatBDT(original)}
                      </span>
                      <span className="font-display text-3xl font-semibold text-emerald-deep">
                        {formatBDT(final)}
                      </span>
                    </>
                  ) : (
                    <span className="font-display text-3xl font-semibold text-emerald-deep">
                      {formatBDT(final)}
                    </span>
                  )}
                  <span className="text-sm text-ink-faint">/ person</span>
                </div>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-ink-faint">Book now from</span>
                    <span className="font-semibold text-ink">
                      {formatBDT(advance)} ({tour.advancePercent}%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-ink-faint">Remaining</span>
                    <span className="font-semibold text-ink">{dueLabel}</span>
                  </div>
                </div>
                <Link href="#book" className="btn btn-emerald mt-5 w-full">
                  Book this tour
                </Link>
                <p className="mt-3 text-center text-xs text-ink-faint">
                  Balance settled online or in cash on tour day
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Gallery */}
      <section className="px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <Stagger className="grid grid-cols-2 gap-3 md:grid-cols-4" stagger={0.06}>
            {tour.gallery.map((scene, i) => (
              <StaggerItem
                key={scene.label}
                className={i === 0 ? "col-span-2 row-span-2" : ""}
              >
                <SceneBackdrop
                  scene={scene}
                  className={`w-full rounded-3xl ${
                    i === 0 ? "aspect-square md:aspect-auto md:h-full" : "aspect-[4/3]"
                  }`}
                  showLabel={false}
                />
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Overview */}
      <section className="px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <div className="glass glass-sweep rounded-3xl p-7 sm:p-8">
              <p className="text-lg leading-relaxed text-ink-soft">
                {tour.description}
              </p>
              <div className="mt-6 grid grid-cols-2 gap-4 border-t border-white/60 pt-6 sm:grid-cols-3 lg:grid-cols-5">
                {[
                  { icon: "clock", label: "Duration", value: tour.duration },
                  { icon: "usersGroup", label: "Capacity", value: `${tour.capacity} travelers` },
                  { icon: "calendar", label: "Departs", value: tour.departure },
                  { icon: "home", label: "Stay", value: tour.accommodation },
                  { icon: "route", label: "Transport", value: tour.transportation },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald/10 text-emerald">
                      <Icon name={item.icon} className="h-4 w-4" />
                    </span>
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
                        {item.label}
                      </div>
                      <div className="text-sm font-medium text-ink">{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Itinerary */}
      <section className="px-4 py-10 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <Reveal>
              <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
                Itinerary
              </h2>
            </Reveal>
            <div className="mt-6 space-y-4">
              {tour.itinerary.map((day, i) => (
                <Reveal key={day.day} delay={i * 0.05}>
                  <div className="glass glass-sweep flex gap-4 rounded-3xl p-5">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald to-emerald-deep font-display text-sm font-semibold text-white">
                      Day {day.day}
                    </span>
                    <div>
                      <h3 className="font-display text-base font-semibold text-ink">
                        {day.title}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                        {day.description}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <Reveal>
              <div className="glass glass-sweep rounded-3xl p-6">
                <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
                  <Icon name="check" className="h-5 w-5 text-emerald" />
                  Inclusions
                </h2>
                <ul className="mt-4 space-y-2.5">
                  {tour.inclusions.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-ink-soft">
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald/15 text-emerald">
                        <Icon name="check" className="h-3 w-3" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal delay={0.06}>
              <div className="glass glass-sweep rounded-3xl p-6">
                <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
                  <Icon name="receipt" className="h-5 w-5 text-coral" />
                  Exclusions
                </h2>
                <ul className="mt-4 space-y-2.5">
                  {tour.exclusions.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-ink-soft">
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-coral/15 text-coral">
                        <Icon name="receipt" className="h-3 w-3" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="glass glass-sweep rounded-3xl p-6">
                <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
                  <Icon name="mapPin" className="h-5 w-5 text-gold" />
                  Meeting point
                </h2>
                <p className="mt-3 text-sm text-ink-soft">{tour.meetingPoint}</p>
                <h2 className="mt-5 flex items-center gap-2 font-display text-lg font-semibold text-ink">
                  <Icon name="sparkle" className="h-5 w-5 text-gold" />
                  Meals
                </h2>
                <p className="mt-3 text-sm text-ink-soft">{tour.meals}</p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Payment note */}
      <section className="px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald to-emerald-deep p-7 text-white sm:p-8">
              <div className="relative z-10 flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                    <Icon name="ticket" className="h-6 w-6" />
                  </span>
                  <div>
                    <h2 className="font-display text-xl font-semibold">
                      How payment works
                    </h2>
                    <p className="mt-1 max-w-xl text-sm leading-relaxed text-emerald-50/90">
                      Book with a {tour.advancePercent}% advance ({formatBDT(advance)})
                      via bKash, Nagad, or card. Your digital e-ticket and booking voucher
                      arrive instantly on WhatsApp and email. On tour day,
                      clear the remaining balance online or in cash with your host — with
                      confirmation sent to both you and our team.
                    </p>
                  </div>
                </div>
                <Link href="#book" className="btn btn-gold shrink-0">
                  Book this tour
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Booking form */}
      <section id="book" className="scroll-mt-24 px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <Reveal>
            <h2 className="mb-4 text-center font-display text-2xl font-semibold text-ink sm:text-3xl">
              Reserve your seat
            </h2>
            <BookingForm tour={tour} finalPrice={final} advanceAmount={advance} />
          </Reveal>
        </div>
      </section>

      {/* FAQs */}
      {tour.faqs.length > 0 && (
        <section className="px-4 py-10 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <Reveal>
              <h2 className="text-center font-display text-2xl font-semibold text-ink sm:text-3xl">
                Common questions
              </h2>
            </Reveal>
            <div className="mt-8 space-y-3">
              {tour.faqs.map((faq, i) => (
                <Reveal key={faq.question} delay={i * 0.05}>
                  <details className="glass group rounded-2xl p-5">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-base font-semibold text-ink">
                      {faq.question}
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald/10 text-emerald transition-transform duration-300 group-open:rotate-45">
                        <Icon name="support" className="h-4 w-4" />
                      </span>
                    </summary>
                    <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                      {faq.answer}
                    </p>
                  </details>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
