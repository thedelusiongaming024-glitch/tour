import type { Metadata } from "next";
import Link from "next/link";
import { Atmosphere } from "@/components/Atmosphere";
import { Reveal } from "@/components/Reveal";
import { Stagger, StaggerItem } from "@/components/Stagger";
import { SectionHeading } from "@/components/SectionHeading";
import { SceneBackdrop } from "@/components/SceneBackdrop";
import { CtaBanner } from "@/components/CtaBanner";
import { Icon } from "@/components/Icon";
import { whyUs, siteName, siteNameBn } from "@/data/site";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "The story, values, and local hosts behind ATITHI — a premium domestic travel agency built for Bangladesh.",
};

const values = [
  {
    icon: "shield",
    title: "Radical transparency",
    description:
      "Every taka is accounted for — the price you see is the price you pay, and every payment is confirmed on both sides.",
  },
  {
    icon: "users",
    title: "Local, always",
    description:
      "No outsourced guides, no foreign templates. Every host is Bangladeshi, and every itinerary is built around real local knowledge.",
  },
  {
    icon: "heart",
    title: "Hospitality first",
    description:
      "Atithi — \"guest\" — is central to Bengali culture. We host you the way we'd host family, not process you like a booking number.",
  },
  {
    icon: "sparkle",
    title: "Considered detail",
    description:
      "From the ridge walk only locals know to the candlelit dinner arranged without being asked — the small things are the trip.",
  },
];

const team = [
  {
    name: "Raisa Chowdhury",
    role: "Co-founder & Head of Experience",
    bio: "Ten years guiding across the Chittagong Hill Tracts before building Atithi's tour design team.",
    scene: "sajek" as const,
  },
  {
    name: "Tanvir Hasan",
    role: "Co-founder & Head of Operations",
    bio: "Runs the host network and on-ground logistics across all twelve destinations.",
    scene: "sundarbans" as const,
  },
  {
    name: "Mehedi Hasan",
    role: "Head of Finance",
    bio: "Built the payment and QR clearance system so every advance and balance is tracked without ambiguity.",
    scene: "coxsbazar" as const,
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-14 pt-32 sm:px-6 sm:pt-40">
        <Atmosphere intensity={0.28} />
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <Reveal>
            <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-emerald-deep">
              <Icon name="heart" className="h-4 w-4" />
              Our story
            </span>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="mt-6 font-display text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl md:text-6xl">
              Built by people who call
              <br className="hidden sm:block" /> Bangladesh home
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft">
              {siteName} ({siteNameBn}) started with a simple frustration: booking
              a domestic trip meant middlemen, vague pricing, and cash changing
              hands with no record. We built the agency we wished existed —
              local hosts, honest pricing, and a payment system that leaves
              nothing to dispute.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Story */}
      <section className="px-4 py-10 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2 lg:items-center">
          <Reveal>
            <SceneBackdrop
              scene={{ key: "bandarban", label: "Hills of the Chittagong Hill Tracts" }}
              className="aspect-[4/3] w-full rounded-[2rem]"
              showLabel={false}
            />
          </Reveal>
          <Reveal delay={0.08}>
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-gold">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              Where it started
            </span>
            <h2 className="mt-4 font-display text-2xl font-semibold text-ink sm:text-3xl">
              From a shared frustration to a proper agency
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink-soft">
              Our founders spent years guiding travelers across the hill
              tracts, the coast, and the mangrove forests as freelance hosts —
              and kept running into the same problem from the customer side:
              no clear pricing, no digital record of what was paid, and no way
              to hold anyone accountable when a trip didn&apos;t match what was
              promised.
            </p>
            <p className="mt-4 text-base leading-relaxed text-ink-soft">
              So we built {siteName} as a proper operating system for domestic
              travel — a public site you can trust, a booking flow that takes
              minutes, and a split-payment system where the advance and the
              on-site balance are both confirmed to you and to us, every
              single time.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Values */}
      <section className="relative bg-pearl-deep/60 px-4 py-16 sm:px-6 sm:py-24">
        <Atmosphere intensity={0.15} />
        <div className="relative z-10 mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="What we stand for"
            eyebrowBn="আমাদের মূল্যবোধ"
            title="The values behind every trip"
            titleBn="প্রতিটি ভ্রমণের পেছনের মূল নীতি"
          />
          <Stagger className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4" stagger={0.08}>
            {values.map((value) => (
              <StaggerItem key={value.title} className="h-full">
                <div className="glass glass-sweep flex h-full flex-col gap-3 rounded-3xl p-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald/10 text-emerald">
                    <Icon name={value.icon} className="h-5 w-5" />
                  </span>
                  <h3 className="font-display text-base font-semibold text-ink">
                    {value.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-ink-soft">
                    {value.description}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Why us (reuse site data) */}
      <section className="px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="How booking works"
            eyebrowBn="বুকিং যেভাবে কাজ করে"
            title="Zero-friction, start to finish"
            titleBn="সহজ ও ঝামেলামুক্ত অভিজ্ঞতা"
            description="From your first search to your final QR-cleared payment, every step is designed to remove friction and ambiguity."
            descriptionBn="অনুসন্ধান থেকে শুরু করে কিউআর পেমেন্ট পর্যন্ত — প্রতিটি ধাপ সাজানো হয়েছে সম্পূর্ণ স্বাচ্ছন্দ্যে।"
          />
          <Stagger className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" stagger={0.08}>
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
      </section>

      {/* Team */}
      <section className="relative bg-pearl-deep/60 px-4 py-16 sm:px-6 sm:py-24">
        <Atmosphere intensity={0.15} />
        <div className="relative z-10 mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="The team"
            eyebrowBn="আমাদের টিম"
            title="A few of the people who'll host you"
            titleBn="আপনার সেবায় নিবেদিত আমাদের দলের সদস্যগণ"
          />
          <Stagger className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" stagger={0.1}>
            {team.map((member) => (
              <StaggerItem key={member.name} className="h-full">
                <div className="glass glass-sweep h-full overflow-hidden rounded-3xl">
                  <SceneBackdrop
                    scene={{ key: member.scene, label: member.name }}
                    className="aspect-[4/3] w-full"
                    showLabel={false}
                  />
                  <div className="p-6">
                    <h3 className="font-display text-base font-semibold text-ink">
                      {member.name}
                    </h3>
                    <p className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-emerald">
                      {member.role}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                      {member.bio}
                    </p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Payment & QR clearance explainer */}
      <section className="px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-emerald to-emerald-deep p-8 text-white sm:p-14">
              <Atmosphere intensity={0.2} />
              <div className="relative z-10 mx-auto max-w-3xl text-center">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium backdrop-blur">
                  <Icon name="qr" className="h-4 w-4" />
                  Payment & QR clearance
                </span>
                <h2 className="mt-5 font-display text-2xl font-semibold sm:text-3xl">
                  How your money is handled, end to end
                </h2>
                <p className="mt-4 text-base leading-relaxed text-emerald-50/90">
                  Pay in full or pay a small advance through bKash, Nagad,
                  Rocket, or card at booking. If you paid partially, the
                  remaining balance is settled on the day of the tour — either
                  your host scans your personal QR code, or you log in and pay
                  it yourself. The moment it clears, both you and our team get
                  a WhatsApp and email confirmation, so there&apos;s a clean
                  record of what was paid, when, on both sides.
                </p>
                <Link href="/contact" className="btn btn-gold mt-8">
                  Talk to us
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <CtaBanner
        title="Ready to plan your own story?"
        description="Tell us where you want to go — we'll take it from there, right through to the final QR-cleared payment."
      />
    </>
  );
}
