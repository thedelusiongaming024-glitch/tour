import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Reveal } from "@/components/Reveal";
import { Stagger, StaggerItem } from "@/components/Stagger";
import { SceneBackdrop } from "@/components/SceneBackdrop";
import { BookingForm } from "@/components/BookingForm";
import { Icon } from "@/components/Icon";
import { TourHeroBackgroundSlider, type TourHeroSlide } from "@/components/TourHeroBackgroundSlider";
import { fetchDestination, fetchTour } from "@/lib/api";
import { getBanglaWatermark } from "@/lib/banglaNames";

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

  // Collect tour photos for the hero background auto-slide animation
  const heroBackgroundSlides: TourHeroSlide[] = [];
  const seenImageUrls = new Set<string>();

  const registerSlide = (slide: TourHeroSlide) => {
    const key = slide.image ? slide.image.trim() : `scene-${slide.sceneKey || slide.id}`;
    if (!seenImageUrls.has(key)) {
      seenImageUrls.add(key);
      heroBackgroundSlides.push(slide);
    }
  };

  // 1. Tour primary cover
  if (tour.cover?.imageUrl) {
    registerSlide({
      id: "tour-cover",
      image: tour.cover.imageUrl,
      title: tour.title,
      subtitle: destination?.name || tour.category,
      sceneKey: tour.cover.key,
    });
  }

  // 2. Tour gallery photos
  if (Array.isArray(tour.gallery)) {
    tour.gallery.forEach((g, idx) => {
      if (g.imageUrl) {
        registerSlide({
          id: `tour-gallery-${idx}`,
          image: g.imageUrl,
          title: g.label || tour.title,
          subtitle: destination?.name || tour.category,
          sceneKey: g.key,
        });
      }
    });
  }

  // 3. Destination cover and gallery
  if (destination) {
    if (destination.cover?.imageUrl) {
      registerSlide({
        id: "dest-cover",
        image: destination.cover.imageUrl,
        title: destination.name,
        subtitle: destination.region,
        sceneKey: destination.cover.key,
      });
    }

    if (Array.isArray(destination.gallery)) {
      destination.gallery.forEach((dg, idx) => {
        if (dg.imageUrl) {
          registerSlide({
            id: `dest-gallery-${idx}`,
            image: dg.imageUrl,
            title: dg.label || destination.name,
            subtitle: destination.region,
            sceneKey: dg.key,
          });
        }
      });
    }
  }

  // Fallback: If no photos were found, ensure cover or local scenery exists
  if (heroBackgroundSlides.length === 0) {
    heroBackgroundSlides.push({
      id: "slide-fallback-1",
      image: tour.cover?.imageUrl || "/images/mountain-hero.jpg",
      title: tour.title,
      subtitle: destination?.name || tour.category,
      sceneKey: tour.cover?.key || "bandarban",
    });
  }

  // Authentic Bengali Typography Watermark (Matches reference screenshot media_1789969477259.png)
  const watermarkText = getBanglaWatermark(
    tour.title,
    destination?.slug,
    destination?.name,
    destination?.bn
  );

  // Breadcrumbs (Home > Packages > Tour Title)
  const breadcrumbs = (
    <>
      <Link
        href="/"
        className="text-white/75 hover:text-white transition-colors"
      >
        Home
      </Link>
      <span className="text-white/50 text-xs font-bold">&gt;</span>
      <Link
        href="/tours"
        className="text-white/75 hover:text-white transition-colors"
      >
        Packages
      </Link>
      <span className="text-white/50 text-xs font-bold">&gt;</span>
      <span className="text-white font-medium truncate max-w-xs sm:max-w-md">
        {tour.title}
      </span>
    </>
  );

  // Meta Pill Badges (📍 Destination, 🏷️ Category)
  const heroBadges = [
    {
      icon: "mapPin",
      label: destination?.name || "Sundarbans",
      color: "text-rose-400",
    },
    {
      icon: "tag",
      label: tour.category || "Inbound",
      color: "text-emerald-400",
    },
  ];

  return (
    <>
      {/* Hero Banner with Auto-Slide Background, Giant Bengali Watermark, Breadcrumbs & Pills */}
      <section className="relative overflow-hidden">
        <TourHeroBackgroundSlider
          slides={heroBackgroundSlides}
          interval={5500}
          watermarkText={watermarkText}
          breadcrumbs={breadcrumbs}
          title={tour.title}
          badges={heroBadges}
        />
      </section>

      {/* Main Content & Sticky Booking Section */}
      <section className="px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            {/* Left Column (Main Tour Information) */}
            <div className="lg:col-span-8 space-y-10">
              {/* Quick Specs Bar */}
              <Reveal>
                <div className="glass glass-sweep rounded-3xl p-6 sm:p-7">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
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

              {/* Gallery Grid */}
              {tour.gallery.length > 0 && (
                <div>
                  <Reveal>
                    <h2 className="mb-4 font-display text-xl font-semibold text-ink sm:text-2xl">
                      Tour Photos & Scenery
                    </h2>
                  </Reveal>
                  <Stagger className="grid grid-cols-2 gap-3 sm:grid-cols-3" stagger={0.06}>
                    {tour.gallery.map((scene, i) => (
                      <StaggerItem
                        key={scene.label || i}
                        className={i === 0 ? "col-span-2 row-span-2" : ""}
                      >
                        <SceneBackdrop
                          scene={scene}
                          className={`w-full rounded-3xl ${
                            i === 0 ? "aspect-square sm:aspect-auto sm:h-full min-h-[220px]" : "aspect-[4/3]"
                          }`}
                          showLabel={false}
                        />
                      </StaggerItem>
                    ))}
                  </Stagger>
                </div>
              )}

              {/* Tour Overview / Description */}
              <Reveal>
                <div className="glass glass-sweep rounded-3xl p-7 sm:p-8">
                  <h2 className="mb-3 font-display text-xl font-semibold text-ink sm:text-2xl">
                    Overview
                  </h2>
                  <p className="text-base sm:text-lg leading-relaxed text-ink-soft">
                    {tour.description}
                  </p>
                </div>
              </Reveal>

              {/* Itinerary */}
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

              {/* Inclusions & Exclusions */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Reveal>
                  <div className="glass glass-sweep h-full rounded-3xl p-6">
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
                  <div className="glass glass-sweep h-full rounded-3xl p-6">
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
              </div>

              {/* Meeting & Boarding Points */}
              <Reveal delay={0.1}>
                <div className="glass glass-sweep rounded-3xl p-6 sm:p-7">
                  <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
                    <Icon name="mapPin" className="h-5 w-5 text-gold" />
                    Meeting & Boarding Points
                  </h2>
                  <p className="mt-3 text-sm text-ink-soft">{tour.meetingPoint}</p>
                  {tour.pickupPoints && tour.pickupPoints.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-ink/5">
                      <span className="text-xs font-semibold text-slate-700 block mb-1.5">
                        Available Pick-up Spots:
                      </span>
                      <ul className="space-y-1 text-xs text-ink-soft">
                        {tour.pickupPoints.map((pt) => (
                          <li key={pt} className="flex items-center gap-1.5">
                            <span className="text-emerald-700">📍</span>
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <h2 className="mt-5 flex items-center gap-2 font-display text-lg font-semibold text-ink">
                    <Icon name="sparkle" className="h-5 w-5 text-gold" />
                    Meals
                  </h2>
                  <p className="mt-3 text-sm text-ink-soft">{tour.meals}</p>
                </div>
              </Reveal>

              {/* Payment Explainer Card */}
              <Reveal>
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald to-emerald-deep p-6 sm:p-7 text-white shadow-md">
                  <div className="relative z-10 flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
                    <div className="flex items-start gap-4">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                        <Icon name="ticket" className="h-5 w-5" />
                      </span>
                      <div>
                        <h2 className="font-display text-lg font-semibold">
                          How payment works
                        </h2>
                        <p className="mt-1 text-xs sm:text-sm leading-relaxed text-emerald-50/90">
                          Book with a {tour.advancePercent}% advance ({formatBDT(advance)})
                          via bKash, Nagad, or card through SSLCommerz. Your official e-ticket
                          arrives instantly on WhatsApp and email. On tour day,
                          clear the remaining balance online or in cash with your tour director.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>

              {/* Booking form */}
              <div id="book" className="scroll-mt-24 pt-4">
                <Reveal>
                  <div className="mb-4 text-center">
                    <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
                      Reserve your seat
                    </h2>
                    <p className="text-sm text-ink-soft mt-1">
                      Fill out your details to lock in your booking and receive your boarding pass.
                    </p>
                  </div>
                  <BookingForm tour={tour} finalPrice={final} advanceAmount={advance} />
                </Reveal>
              </div>

              {/* FAQs */}
              {tour.faqs.length > 0 && (
                <div className="pt-4">
                  <Reveal>
                    <h2 className="text-center font-display text-2xl font-semibold text-ink sm:text-3xl">
                      Common questions
                    </h2>
                  </Reveal>
                  <div className="mt-6 space-y-3">
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
              )}
            </div>

            {/* Right Column (Sticky Pricing Sidebar) */}
            <div className="lg:col-span-4">
              <div className="sticky top-28 space-y-5">
                {/* Price card */}
                <div className="glass glass-sweep rounded-3xl p-6 sm:p-7 shadow-glass-lg border border-white/60">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 text-xs font-semibold">
                      <span>✓</span>
                      <span>Instant Confirmation</span>
                    </span>
                    {tour.discount > 0 && (
                      <span className="inline-flex items-center rounded-full bg-coral/10 text-coral border border-coral/20 px-2.5 py-0.5 text-xs font-bold">
                        Save {formatBDT(tour.discount)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline gap-2">
                    {tour.discount > 0 ? (
                      <>
                        <span className="text-base text-ink-faint line-through">
                          {formatBDT(original)}
                        </span>
                        <span className="font-display text-3xl sm:text-4xl font-bold text-emerald-deep">
                          {formatBDT(final)}
                        </span>
                      </>
                    ) : (
                      <span className="font-display text-3xl sm:text-4xl font-bold text-emerald-deep">
                        {formatBDT(final)}
                      </span>
                    )}
                    <span className="text-sm font-medium text-ink-faint">/ person</span>
                  </div>

                  <div className="mt-4 space-y-2.5 rounded-2xl bg-pearl/60 border border-ink/5 p-4 text-xs sm:text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-ink-faint">Advance to book</span>
                      <span className="font-bold text-emerald-800">
                        {formatBDT(advance)} ({tour.advancePercent}%)
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-ink/5 pt-2">
                      <span className="text-ink-faint">Remaining balance</span>
                      <span className="font-semibold text-ink">{dueLabel}</span>
                    </div>
                  </div>

                  <Link
                    href="#book"
                    className="btn btn-emerald mt-5 w-full flex items-center justify-center gap-2 text-base font-semibold shadow-md"
                  >
                    <span>Reserve Your Seat</span>
                    <Icon name="arrowRight" className="h-4 w-4" />
                  </Link>

                  <p className="mt-3 text-center text-xs text-ink-faint">
                    100% money-back guarantee if tour is rescheduled
                  </p>

                  <div className="mt-6 border-t border-ink/5 pt-5 space-y-2 text-xs text-ink-soft">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald font-bold">✓</span>
                      <span>Official Savar Tour Lover E-Ticket</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald font-bold">✓</span>
                      <span>Verified Coach & Hotel Reservation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald font-bold">✓</span>
                      <span>SSLCommerz Secure Bank & MFS Checkout</span>
                    </div>
                  </div>
                </div>

                {/* Helpline / Direct Support Card */}
                <div className="glass rounded-3xl p-5 text-ink-soft border border-white/60 text-xs">
                  <div className="flex items-center gap-2.5 mb-2.5 text-sm font-bold text-ink">
                    <Icon name="support" className="h-5 w-5 text-emerald" />
                    <span>Need Help Booking?</span>
                  </div>
                  <p className="mb-3 leading-relaxed">
                    Have questions about seats or custom dates? Our team is available 24/7.
                  </p>
                  <div className="space-y-1.5 font-medium">
                    <a
                      href="tel:+8801620592884"
                      className="flex items-center gap-2 text-emerald-800 hover:text-emerald font-semibold"
                    >
                      <Icon name="phone" className="h-3.5 w-3.5" />
                      <span>+880 1620-592884</span>
                    </a>
                    <a
                      href="https://wa.me/8801646325350"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-teal-800 hover:text-teal font-semibold"
                    >
                      <Icon name="whatsapp" className="h-3.5 w-3.5" />
                      <span>WhatsApp: +880 1646-325350</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
