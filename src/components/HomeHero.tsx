"use client";

import Link from "next/link";
import { HeroSlideshow } from "@/components/HeroSlideshow";
import { HeroVideoBackdrop } from "@/components/HeroVideoBackdrop";
import { Reveal } from "@/components/Reveal";
import { Stagger, StaggerItem } from "@/components/Stagger";
import { Icon } from "@/components/Icon";
import { useLanguage } from "@/context/LanguageContext";
import { heroStats } from "@/data/site";
import type { HeroSlideItem } from "@/server/types";

interface HomeHeroProps {
  eyebrow?: string | null;
  headline?: string | null;
  highlight?: string | null;
  subheadline?: string | null;
  primaryCtaLabel?: string | null;
  primaryCtaHref?: string | null;
  secondaryCtaLabel?: string | null;
  secondaryCtaHref?: string | null;
  statsOverride?: { value: string; label: string }[] | null;
  mediaType?: "slideshow" | "video" | null;
  videoUrl?: string | null;
  slides?: HeroSlideItem[] | null;
}

export function HomeHero({
  eyebrow,
  headline,
  highlight,
  subheadline,
  primaryCtaLabel,
  primaryCtaHref,
  secondaryCtaLabel,
  secondaryCtaHref,
  statsOverride,
  mediaType,
  videoUrl,
  slides,
}: HomeHeroProps) {
  const { t, isBn, formatNumber } = useLanguage();

  const stats = statsOverride ?? heroStats;

  const defaultEyebrow = isBn
    ? "বাংলাদেশ জুড়ে প্রিমিয়াম লোকাল ভ্রমণ অভিজ্ঞতা"
    : (eyebrow ?? "Premium domestic tours across Bangladesh");

  const defaultHeadline = isBn
    ? "বাংলাদেশ দেখুন,"
    : (headline ?? "Discover Bangladesh,");

  const defaultHighlight = isBn
    ? "আপনার মতো করে"
    : (highlight ?? "your way");

  const defaultSubheadline = isBn
    ? "বাছাই করা দেশীয় ট্যুর প্যাকেজ। বিশ্বস্ত লোকাল হোস্ট। সামান্য অগ্রিমে বুকিং করুন এবং বাকি টাকা ভ্রমণের দিন পরিশোধ করুন — শতভাগ স্বচ্ছতায়।"
    : (subheadline ?? "Curated domestic tours. Trusted local hosts. Book with a small advance and clear the balance on tour day — with complete transparency, every time.");

  const defaultPrimaryCta = isBn
    ? "ট্যুরগুলো দেখুন"
    : (primaryCtaLabel ?? "Explore Tours");

  const defaultSecondaryCta = isBn
    ? "ভ্রমণ পরিকল্পনা"
    : (secondaryCtaLabel ?? "Plan My Trip");

  const localizedStats = stats.map((stat) => {
    if (!isBn) return stat;
    let val = stat.value;
    val = val.replace(/\d+/g, (m) => formatNumber(Number(m)));
    let lbl = stat.label;
    if (lbl.toLowerCase().includes("region")) lbl = "আঞ্চলিক গন্তব্য";
    else if (lbl.toLowerCase().includes("host")) lbl = "ভেরিফায়েড হোস্ট";
    else if (lbl.toLowerCase().includes("departure")) lbl = "নিশ্চিত যাত্রা";
    else if (lbl.toLowerCase().includes("rating")) lbl = "ভ্রমণকারী রেটিং";
    return { value: val, label: lbl };
  });

  return (
    <section className="relative overflow-hidden px-4 pb-24 pt-32 sm:px-6 sm:pt-40">
      {mediaType === "video" && videoUrl ? (
        <HeroVideoBackdrop videoUrl={videoUrl} fallbackSlides={slides ?? undefined} />
      ) : (
        <HeroSlideshow slides={slides ?? undefined} />
      )}
      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <Reveal>
            <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-emerald-deep">
              <Icon name="mapPin" className="h-4 w-4" />
              {defaultEyebrow}
            </span>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-6xl md:text-7xl">
              {defaultHeadline}
              <br />
              <span className="bg-gradient-to-r from-emerald via-emerald-deep to-gold bg-clip-text text-transparent">
                {defaultHighlight}
              </span>
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
              {defaultSubheadline}
            </p>
          </Reveal>
          <Reveal delay={0.24}>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href={primaryCtaHref ?? "/tours"} className="btn btn-emerald">
                {defaultPrimaryCta}
              </Link>
              <Link href={secondaryCtaHref ?? "/contact"} className="btn btn-glass">
                {defaultSecondaryCta}
              </Link>
            </div>
          </Reveal>
        </div>

        {/* Stat panel */}
        {localizedStats.length > 0 && (
          <Reveal delay={0.32} className="mx-auto mt-14 max-w-4xl">
            <Stagger
              className="glass glass-sweep grid grid-cols-2 gap-y-8 rounded-[2rem] p-6 sm:grid-cols-4 sm:p-8"
              stagger={0.08}
            >
              {localizedStats.map((stat) => (
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
        )}
      </div>
    </section>
  );
}
