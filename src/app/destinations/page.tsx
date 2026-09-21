import type { Metadata } from "next";
import Link from "next/link";
import { Atmosphere } from "@/components/Atmosphere";
import { Reveal } from "@/components/Reveal";
import { Stagger, StaggerItem } from "@/components/Stagger";
import { SectionHeading } from "@/components/SectionHeading";
import { DestinationCard } from "@/components/DestinationCard";
import { fetchDestinations } from "@/lib/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Destinations",
  description:
    "Explore the destinations of Bangladesh — Cox's Bazar, Sajek Valley, Sundarbans, Sylhet tea country, and more.",
};

export default async function DestinationsPage() {
  const destinations = await fetchDestinations();

  return (
    <>
      <section className="relative overflow-hidden px-4 pb-16 pt-32 sm:px-6 sm:pt-40">
        <Atmosphere intensity={0.25} />
        <div className="relative z-10 mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="Destinations"
            eyebrowBn="ভ্রমণ গন্তব্য"
            title="Twelve regions. One extraordinary country."
            titleBn="বারোটি অঞ্চল। একটি অপরূপ বাংলাদেশ।"
            description="Beaches, hill tracts, mangrove forests, tea gardens, and two millennia of history — every corner of Bangladesh, hosted by people who call it home."
            descriptionBn="সৈকত, পাহাড়, ম্যানগ্রোভ বন, চায়ের বাগান আর প্রাচীন ইতিহাস — বাংলাদেশের প্রতিটি কোণে নির্ভরযোগ্য স্থানীয় আতিথেয়তা।"
          />
        </div>
      </section>

      <section className="px-4 pb-24 sm:px-6">
        <div className="mx-auto max-w-6xl">
          {destinations.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-xs">
              <h3 className="font-display text-lg font-semibold text-ink">No destinations listed yet</h3>
              <p className="mt-2 text-sm text-ink-soft max-w-md mx-auto">
                Explore packages and destinations once added and published from the Super Admin Panel.
              </p>
            </div>
          ) : (
            <Stagger className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" stagger={0.08}>
              {destinations.map((d) => (
                <StaggerItem key={d.slug}>
                  <DestinationCard destination={d} />
                </StaggerItem>
              ))}
            </Stagger>
          )}

          <Reveal className="mt-14">
            <div className="glass glass-sweep flex flex-col items-center gap-4 rounded-3xl p-8 text-center sm:flex-row sm:justify-between sm:text-left">
              <div>
                <h2 className="font-display text-xl font-semibold text-ink">
                  Can&apos;t decide?
                </h2>
                <p className="mt-1 text-sm text-ink-soft">
                  Tell us your dates, group size, and what you love — we&apos;ll
                  recommend the perfect destination.
                </p>
              </div>
              <Link href="/contact" className="btn btn-emerald shrink-0">
                Plan My Trip
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
