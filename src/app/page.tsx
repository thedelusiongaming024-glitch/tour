import Link from "next/link";
import { Atmosphere } from "@/components/Atmosphere";
import { HeroSlideshow } from "@/components/HeroSlideshow";
import { Reveal } from "@/components/Reveal";
import { Stagger, StaggerItem } from "@/components/Stagger";
import { SectionHeading } from "@/components/SectionHeading";
import { DestinationCard } from "@/components/DestinationCard";
import { PopularToursExplorer } from "@/components/PopularToursExplorer";
import { ServiceCard } from "@/components/ServiceCard";
import { OfferCard } from "@/components/OfferCard";
import { ReviewCard } from "@/components/ReviewCard";
import { JournalCard } from "@/components/JournalCard";
import { CtaBanner } from "@/components/CtaBanner";
import { Icon } from "@/components/Icon";
import { destinations as staticDestinations } from "@/data/destinations";
import { tours as staticTours } from "@/data/tours";
import { journalPosts as staticJournalPosts } from "@/data/journal";
import {
  heroStats,
  whyUs,
  services,
  specialOffers as staticSpecialOffers,
  reviews as staticReviews,
  destinationsForHome,
  siteName,
  siteNameBn,
} from "@/data/site";
import { fetchDestinations, fetchHomepageBlocks, fetchJournalPosts, fetchOffers, fetchTestimonials, fetchTours } from "@/lib/api";

/** Reads a string field out of a block's loosely-typed JSON content, or null. */
function str(content: Record<string, unknown>, key: string): string | null {
  const v = content[key];
  return typeof v === "string" && v.trim() ? v : null;
}

export default async function Home() {
  const [liveDestinations, liveTours, liveJournal, liveOffers, liveReviews, liveBlocks] = await Promise.all([
    fetchDestinations(),
    fetchTours(),
    fetchJournalPosts(),
    fetchOffers(),
    fetchTestimonials(),
    fetchHomepageBlocks(),
  ]);

  const destinations = liveDestinations ?? staticDestinations;
  const tours = liveTours ?? staticTours;
  const journalPosts = liveJournal && liveJournal.length > 0 ? liveJournal : staticJournalPosts;
  const specialOffers = liveOffers && liveOffers.length > 0 ? liveOffers : staticSpecialOffers;
  const reviews = liveReviews && liveReviews.length > 0 ? liveReviews : staticReviews;
  const blocks = liveBlocks ?? [];

  // Admin-editable homepage blocks (Django admin -> Homepage Blocks). See
  // cms/models.py's HomepageBlock.content help_text for the exact schema
  // per block_type. Every value here is optional — anything an admin
  // hasn't filled in falls back to the site's built-in default copy, so a
  // half-filled-in block never breaks the page.
  const heroBlock = blocks.find((b) => b.blockType === "hero");
  const heroContent = heroBlock?.content ?? {};
  const heroStatsOverride = Array.isArray(heroContent.stats)
    ? (heroContent.stats as unknown[])
        .filter((s): s is { value?: unknown; label?: unknown } => typeof s === "object" && s !== null)
        .map((s) => ({ value: typeof s.value === "string" ? s.value : "", label: typeof s.label === "string" ? s.label : "" }))
        .filter((s) => s.value && s.label)
    : null;

  const destinationGridBlock = blocks.find((b) => b.blockType === "destination_grid");
  const featuredToursBlock = blocks.find((b) => b.blockType === "featured_tours");
  const testimonialsBlock = blocks.find((b) => b.blockType === "testimonials");
  const showDestinationsSection = destinationGridBlock?.content.hidden !== true;
  const showFeaturedToursSection = featuredToursBlock?.content.hidden !== true;
  const showTestimonialsSection = testimonialsBlock?.content.hidden !== true;

  // Freeform blocks (rich_text / image / cta / gallery) render as extra
  // sections, in the order an admin arranges them, right after the hero —
  // this is the one place in the page an admin can add net-new content
  // rather than just override existing sections' copy.
  const freeformBlocks = blocks.filter((b) =>
    ["rich_text", "image", "cta", "gallery"].includes(b.blockType)
  );

  // destinationsForHome is a hand-curated homepage selection tied to the
  // static fixtures; live CMS data has no equivalent concept yet, so we
  // just take the first few published destinations instead.
  const featuredDestinations = liveDestinations
    ? liveDestinations.slice(0, 6)
    : destinationsForHome
        .map((d) => destinations.find((x) => x.slug === d.slug))
        .filter((d): d is (typeof destinations)[number] => Boolean(d));

  const popularTours = [...tours].sort(
    (a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured))
  );
  const journalPreview = journalPosts.slice(0, 3);

  return (
    <>
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden px-4 pb-24 pt-32 sm:px-6 sm:pt-40">
        <HeroSlideshow
          scenes={["coxsbazar", "sajek", "sundarbans", "bandarban", "stmartins"]}
        />
        <div className="relative z-10 mx-auto max-w-6xl">
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <Reveal>
              <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-emerald-deep">
                <Icon name="mapPin" className="h-4 w-4" />
                {str(heroContent, "eyebrow") ?? "Premium domestic tours across Bangladesh"}
              </span>
            </Reveal>
            <Reveal delay={0.08}>
              <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-6xl md:text-7xl">
                {str(heroContent, "headline") ?? "Discover Bangladesh,"}
                <br />
                <span className="bg-gradient-to-r from-emerald via-emerald-deep to-gold bg-clip-text text-transparent">
                  {str(heroContent, "highlight") ?? "your way"}
                </span>
              </h1>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
                {str(heroContent, "subheadline") ??
                  "Curated domestic tours. Trusted local hosts. Book with a small advance and clear the balance on tour day — with confirmation to both sides, every time."}
              </p>
            </Reveal>
            <Reveal delay={0.24}>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link href={str(heroContent, "primary_cta_href") ?? "/tours"} className="btn btn-emerald">
                  {str(heroContent, "primary_cta_label") ?? "Explore Tours"}
                </Link>
                <Link href={str(heroContent, "secondary_cta_href") ?? "/contact"} className="btn btn-glass">
                  {str(heroContent, "secondary_cta_label") ?? "Plan My Trip"}
                </Link>
              </div>
            </Reveal>
          </div>

          {/* Stat panel */}
          <Reveal delay={0.32} className="mx-auto mt-14 max-w-4xl">
            <Stagger
              className="glass glass-sweep grid grid-cols-2 gap-y-8 rounded-[2rem] p-6 sm:grid-cols-4 sm:p-8"
              stagger={0.08}
            >
              {(heroStatsOverride ?? heroStats).map((stat) => (
                <StaggerItem key={stat.label} className="text-center">
                  <div className="font-display text-3xl font-semibold text-emerald-deep sm:text-4xl">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-xs font-medium uppercase tracking-wider text-ink-faint sm:text-sm">
                    {stat.label}
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </Reveal>
        </div>
      </section>

      {/* ============ ADMIN-EDITABLE FREEFORM BLOCKS ============ */}
      {/* rich_text / image / cta / gallery HomepageBlocks, in the order an
          admin arranges them in Django Admin. This is the one spot in the
          page an admin can add genuinely new sections, not just override
          existing ones' copy — see cms/models.py's HomepageBlock.content
          help_text for the schema each block_type reads. */}
      {freeformBlocks.map((block) => {
        const c = block.content;
        if (block.blockType === "rich_text") {
          const heading = str(c, "heading");
          const body = str(c, "body");
          if (!heading && !body) return null;
          return (
            <section key={block.id} className="px-4 py-16 sm:px-6 sm:py-20">
              <div className="mx-auto max-w-3xl text-center">
                <SectionHeading eyebrow={str(c, "eyebrow") ?? undefined} title={heading ?? ""} />
                {body && (
                  <div className="mt-6 space-y-4 text-left text-[15px] leading-relaxed text-ink-soft">
                    {body.split("\n\n").filter(Boolean).map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>
                )}
              </div>
            </section>
          );
        }
        if (block.blockType === "image") {
          const imageUrl = str(c, "image_url");
          if (!imageUrl) return null;
          const img = (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={str(c, "caption") ?? ""}
              className="mx-auto max-h-[32rem] w-full max-w-5xl rounded-[2rem] object-cover shadow-glass-lg"
            />
          );
          return (
            <section key={block.id} className="px-4 py-12 sm:px-6">
              {str(c, "href") ? <Link href={str(c, "href")!}>{img}</Link> : img}
              {str(c, "caption") && (
                <p className="mx-auto mt-3 max-w-5xl text-center text-sm text-ink-faint">{str(c, "caption")}</p>
              )}
            </section>
          );
        }
        if (block.blockType === "cta") {
          const heading = str(c, "heading");
          if (!heading) return null;
          // CtaBanner renders its own <section> with its own padding —
          // wrapping it in another <section> here would double the
          // vertical padding and nest <section> tags.
          return (
            <CtaBanner
              key={block.id}
              eyebrow={str(c, "eyebrow") ?? undefined}
              title={heading}
              description={str(c, "body") ?? undefined}
              ctaLabel={str(c, "cta_label") ?? undefined}
              ctaHref={str(c, "cta_href") ?? undefined}
            />
          );
        }
        if (block.blockType === "gallery") {
          const images = Array.isArray(c.images) ? (c.images as unknown[]) : [];
          const heading = str(c, "heading");
          if (images.length === 0) return null;
          return (
            <section key={block.id} className="px-4 py-16 sm:px-6 sm:py-20">
              <div className="mx-auto max-w-6xl">
                {heading && <SectionHeading title={heading} />}
                <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {images
                    .filter((img): img is { url?: unknown; caption?: unknown } => typeof img === "object" && img !== null)
                    .map((img, i) =>
                      typeof img.url === "string" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={i}
                          src={img.url}
                          alt={typeof img.caption === "string" ? img.caption : ""}
                          className="aspect-square w-full rounded-2xl object-cover"
                        />
                      ) : null
                    )}
                </div>
              </div>
            </section>
          );
        }
        return null;
      })}

      {showDestinationsSection && (
      /* ============ POPULAR DESTINATIONS ============
         featuredDestinations was already being computed (live CMS data,
         sliced to 6, falling back to the hand-curated static selection)
         but this section never existed — the homepage fetched and adapted
         destination data, then dropped it on the floor. DestinationCard
         was imported for exactly this and never rendered either. */
      <section className="px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
            <SectionHeading
              align="left"
              eyebrow={str(destinationGridBlock?.content ?? {}, "eyebrow") ?? "Destinations"}
              title={str(destinationGridBlock?.content ?? {}, "heading") ?? "Popular destinations across Bangladesh"}
              description={
                str(destinationGridBlock?.content ?? {}, "description") ??
                "Beaches, hill tracts, mangrove forests, and tea country — pick a place, we'll handle the rest."
              }
            />
            <Link href="/destinations" className="btn btn-glass shrink-0">
              All destinations
              <Icon name="arrowRight" className="h-4 w-4" />
            </Link>
          </div>
          <Stagger className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" stagger={0.08}>
            {featuredDestinations.map((d) => (
              <StaggerItem key={d.slug}>
                <DestinationCard destination={d} />
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>
      )}

      {showFeaturedToursSection && (
      /* ============ POPULAR TOURS ============ */
      <section className="relative bg-pearl-deep/60 px-4 py-16 sm:px-6 sm:py-24">
        <Atmosphere intensity={0.18} />
        <div className="relative z-10 mx-auto max-w-6xl">
          <SectionHeading
            eyebrow={str(featuredToursBlock?.content ?? {}, "eyebrow") ?? "Tour Packages"}
            title={str(featuredToursBlock?.content ?? {}, "heading") ?? "Popular tour packages"}
            description={
              str(featuredToursBlock?.content ?? {}, "description") ??
              "Small groups, local hosts, and everything included. Filter by place, duration, or price to find your trip in seconds."
            }
          />
          <Reveal delay={0.1} className="mt-12">
            <PopularToursExplorer tours={popularTours} destinations={destinations} />
          </Reveal>
          <Reveal className="mt-10 text-center">
            <Link href="/tours" className="btn btn-emerald">
              Browse all tours
              <Icon name="arrowRight" className="h-4 w-4" />
            </Link>
          </Reveal>
        </div>
      </section>
      )}

      {/* ============ WHY US ============ */}
      <section className="px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.2fr]">
            <SectionHeading
              align="left"
              eyebrow={`Why ${siteName}`}
              title="Travel with people who call Bangladesh home"
              description="We're not a booking platform that outsources your trip to strangers. We're local hosts who plan, accompany, and settle every detail — including your final payment, confirmed on both sides."
            />
            <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2" stagger={0.08}>
              {whyUs.map((item) => (
                <StaggerItem key={item.title}>
                  <div className="glass glass-sweep flex h-full flex-col gap-3 rounded-3xl p-5">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold/15 text-gold">
                      <Icon name={item.icon} className="h-5 w-5" />
                    </span>
                    <h3 className="font-display text-base font-semibold text-ink">
                      {item.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-ink-soft">
                      {item.description}
                    </p>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </div>
      </section>

      {/* ============ SERVICES ============ */}
      <section className="relative bg-pearl-deep/60 px-4 py-16 sm:px-6 sm:py-24">
        <Atmosphere intensity={0.15} />
        <div className="relative z-10 mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="Services"
            title="Every kind of trip, handled"
            description="Group or private, family or honeymoon, weekend or expedition — if it's in Bangladesh, we'll host it."
          />
          <Stagger className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" stagger={0.08}>
            {services.map((service) => (
              <StaggerItem key={service.title} className="h-full">
                <ServiceCard service={service} />
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ============ SPECIAL OFFERS ============ */}
      <section className="px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="Special Offers"
            title="A little reason to book today"
            description="Seasonal savings and group perks — applied automatically at checkout with the right code."
          />
          <Stagger className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3" stagger={0.1}>
            {specialOffers.map((offer) => (
              <StaggerItem key={offer.code} className="h-full">
                <OfferCard offer={offer} />
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {showTestimonialsSection && (
      /* ============ REVIEWS ============ */
      <section className="relative bg-pearl-deep/60 px-4 py-16 sm:px-6 sm:py-24">
        <Atmosphere intensity={0.15} />
        <div className="relative z-10 mx-auto max-w-6xl">
          <SectionHeading
            eyebrow={str(testimonialsBlock?.content ?? {}, "eyebrow") ?? "Customer Reviews"}
            title={str(testimonialsBlock?.content ?? {}, "heading") ?? "Loved by travelers across Bangladesh"}
            description={
              str(testimonialsBlock?.content ?? {}, "description") ??
              "Real words from guests who booked, travelled, and settled their balances — all in one seamless flow."
            }
          />
          <Stagger className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3" stagger={0.08}>
            {reviews.slice(0, 6).map((review) => (
              <StaggerItem key={review.name} className="h-full">
                <ReviewCard review={review} />
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>
      )}

      {/* ============ JOURNAL ============ */}
      <section className="px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
            <SectionHeading
              align="left"
              eyebrow="Travel Journal"
              title="Stories from the road"
              description="Field guides, food trails, and honest travel writing from our hosts and guests."
            />
            <Link href="/journal" className="btn btn-glass shrink-0">
              All stories
              <Icon name="arrowRight" className="h-4 w-4" />
            </Link>
          </div>
          <Stagger className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3" stagger={0.1}>
            {journalPreview.map((post) => (
              <StaggerItem key={post.slug} className="h-full">
                <JournalCard post={post} />
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <CtaBanner />

      {/* Hidden bilingual touch */}
      <div className="sr-only">
        {siteName} {siteNameBn}
      </div>
    </>
  );
}
