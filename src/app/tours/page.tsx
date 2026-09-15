import type { Metadata } from "next";
import Link from "next/link";
import { Atmosphere } from "@/components/Atmosphere";
import { Reveal } from "@/components/Reveal";
import { Stagger, StaggerItem } from "@/components/Stagger";
import { SectionHeading } from "@/components/SectionHeading";
import { TourCard } from "@/components/TourCard";
import { Icon } from "@/components/Icon";
import { tours as staticTours } from "@/data/tours";
import { destinations as staticDestinations } from "@/data/destinations";
import { fetchDestinations, fetchTours } from "@/lib/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Tour Packages",
  description:
    "Browse curated domestic tour packages across Bangladesh — group tours, honeymoons, family trips, adventure treks, and weekend getaways.",
};

const categories = [
  "All",
  "Group Tour",
  "Weekend",
  "Adventure",
  "Honeymoon",
  "Heritage",
  "Combo Tour",
  "Day Trip",
];

export default async function ToursPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category: selectedCategory } = await searchParams;
  const activeCategory = categories.includes(selectedCategory ?? "") ? selectedCategory! : "All";

  const [allTours, destinations] = await Promise.all([
    fetchTours().then((live) => live ?? staticTours),
    fetchDestinations().then((live) => live ?? staticDestinations),
  ]);

  // Previously these were plain <span> elements with no href/onClick at
  // all — "All" was permanently styled as selected and clicking any other
  // chip did nothing; the full tour list rendered regardless. Now each
  // chip links to ?category=<name>, which this Server Component reads
  // and filters by server-side — no client JS needed, consistent with
  // this page otherwise being a plain server-rendered route.
  //
  // Note: this matches `tour.category` by exact string against the chip
  // label ("Adventure", "Weekend", ...), which lines up with the static
  // fixture data's category values. Live API tours go through
  // CATEGORY_LABELS in lib/api.ts, which produces different strings for
  // some categories (e.g. "Adventure Tour" instead of "Adventure") and
  // includes categories these chips don't cover at all (private, family,
  // corporate, educational, luxury) — a separate category-taxonomy
  // mismatch between the live API and this static chip list, not
  // something a filtering fix alone can resolve without deciding on and
  // aligning a single canonical category list across both.
  const tours = activeCategory === "All" ? allTours : allTours.filter((t) => t.category === activeCategory);

  return (
    <>
      <section className="relative overflow-hidden px-4 pb-12 pt-32 sm:px-6 sm:pt-40">
        <Atmosphere intensity={0.25} />
        <div className="relative z-10 mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="Tour Packages"
            eyebrowBn="ট্যুর প্যাকেজসমূহ"
            title="Packages built for every kind of traveller"
            titleBn="সকলের জন্য উপযোগী বাছাইকৃত ট্যুর প্যাকেজ"
            description="Every tour includes a local host, transparent pricing, and flexible payment — book from just 40% advance and settle the balance on tour day."
            descriptionBn="প্রতিটি ট্যুরে থাকছে লোকাল হোস্ট, স্পষ্ট মূল্য এবং সুবিধাজনক পেমেন্ট — মাত্র ৪০% অগ্রিমে বুক করুন এবং বাকি টাকা ভ্রমণের দিন পরিশোধ করুন।"
          />
        </div>
      </section>

      <section className="px-4 pb-24 sm:px-6">
        <div className="mx-auto max-w-6xl">
          {/* Category filter bar */}
          <Reveal>
            <div className="glass mb-10 flex flex-wrap items-center gap-2 rounded-full p-2">
              {categories.map((cat) => (
                <Link
                  key={cat}
                  href={cat === "All" ? "/tours" : `/tours?category=${encodeURIComponent(cat)}`}
                  className={
                    cat === activeCategory
                      ? "rounded-full bg-emerald px-4 py-2 text-sm font-semibold text-white"
                      : "rounded-full px-4 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-white/70 hover:text-ink"
                  }
                >
                  {cat}
                </Link>
              ))}
            </div>
          </Reveal>

          {tours.length === 0 ? (
            <p className="py-16 text-center text-ink-soft">
              No tours found in this category right now — check back soon or browse all packages.
            </p>
          ) : (
            <Stagger className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3" stagger={0.08}>
              {tours.map((tour) => (
                <StaggerItem key={tour.slug} className="h-full">
                  <TourCard tour={tour} />
                </StaggerItem>
              ))}
            </Stagger>
          )}

          {/* Destination quick links */}
          {destinations.length > 0 && (
            <Reveal className="mt-16">
              <h2 className="font-display text-xl font-semibold text-ink">
                Explore tours by destination
              </h2>
              <div className="mt-5 flex flex-wrap gap-2.5">
                {destinations.map((d) => (
                  <Link
                    key={d.slug}
                    href={`/destinations/${d.slug}`}
                    className="glass inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-ink-soft transition-colors hover:text-emerald"
                  >
                    <Icon name="mapPin" className="h-3.5 w-3.5" />
                    {d.name}
                  </Link>
                ))}
              </div>
            </Reveal>
          )}
        </div>
      </section>
    </>
  );
}
