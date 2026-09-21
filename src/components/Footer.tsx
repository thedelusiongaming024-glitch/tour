"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Reveal } from "@/components/Reveal";
import { siteName, siteNameBn, siteTagline, siteTaglineBn, siteAddressEn, siteAddressBn, sitePhones } from "@/data/site";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";

export function Footer() {
  const pathname = usePathname();
  const { t, isBn } = useLanguage();

  if (pathname?.startsWith("/staff")) return null;

  const footerNav = {
    [t("footer.explore")]: [
      { href: "/destinations", label: t("footer.destinations") },
      { href: "/tours", label: t("footer.tourPackages") },
      { href: "/journal", label: t("footer.travelJournal") },
      { href: "/about", label: t("footer.aboutUs") },
    ],
    [t("footer.company")]: [
      { href: "/about", label: t("footer.ourStory") },
      { href: "/contact", label: t("footer.contact") },
      { href: "/contact", label: t("footer.planCustomTrip") },
      { href: "/tours", label: t("footer.specialOffers") },
    ],
    [t("footer.support")]: [
      { href: "/contact", label: t("footer.talkToUs") },
      { href: "/journal/sundarbans-on-a-budget-vs-luxury", label: t("footer.travelGuides") },
      { href: "/about", label: t("footer.howBookingWorks") },
      { href: "/about", label: t("footer.paymentQrClearance") },
    ],
  };

  return (
    <footer className="relative mt-auto px-3 pb-6 pt-12 sm:px-6 sm:pb-8 sm:pt-16">
      <div className="mx-auto max-w-6xl">
        <Reveal>
        <div className="glass glass-sweep rounded-3xl sm:rounded-[2rem] p-6 sm:p-10 lg:p-12">
          <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div className="sm:col-span-2 lg:col-span-1">
              <Link href="/" className="inline-block group mb-3 relative">
                <div
                  className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-emerald-400/15 via-teal-300/20 to-emerald-500/15 blur-lg opacity-50 transition-opacity duration-300 group-hover:opacity-90 pointer-events-none"
                  aria-hidden="true"
                />
                <img
                  src="/images/logo-horizontal.png"
                  alt="Savar Tour Lover"
                  className="relative h-12 sm:h-16 w-auto object-contain transition-transform duration-300 group-hover:scale-105 select-none"
                />
              </Link>
              <p className="mt-3.5 max-w-sm text-sm leading-relaxed text-ink-soft">
                {isBn
                  ? "সাভার ট্যুর লাভার — আপনার স্বপ্ন উড়তে দিন। নির্ভরযোগ্য লোকাল হোস্ট, স্পষ্ট মূল্য এবং শতভাগ স্বচ্ছতায় সহজ বুকিং সুবিধা।"
                  : `${siteName} — Let your dreams fly. Curated domestic tours across Bangladesh with trusted local hosts, transparent pricing, and seamless booking confirmation.`}
              </p>
              <div className="mt-4 space-y-2 text-xs text-ink-soft border-t border-emerald/15 pt-3">
                <div className="flex items-start gap-2">
                  <span className="text-emerald font-semibold shrink-0">📍</span>
                  <span className="leading-snug">{isBn ? siteAddressBn : siteAddressEn}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald font-semibold shrink-0">📞</span>
                  <div className="flex flex-wrap items-center gap-2 font-medium text-ink">
                    <a href={`tel:${sitePhones[0]}`} className="hover:text-emerald hover:underline transition">{sitePhones[0]}</a>
                    <span>•</span>
                    <a href={`tel:${sitePhones[1]}`} className="hover:text-emerald hover:underline transition">{sitePhones[1]}</a>
                  </div>
                </div>
              </div>
            </div>

            {Object.entries(footerNav).map(([title, links]) => (
              <div key={title}>
                <h3 className="font-display text-xs sm:text-sm font-semibold uppercase tracking-wider text-ink">
                  {title}
                </h3>
                <ul className="mt-3 sm:mt-4 space-y-2 sm:space-y-2.5">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="inline-block text-sm text-ink-soft transition-all duration-200 hover:translate-x-1 hover:text-emerald py-0.5"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="hairline my-6 sm:my-8" />

          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <p className="text-xs text-ink-faint">
              © {new Date().getFullYear()} {siteName}. {t("footer.allRightsReserved")}
            </p>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-medium text-ink-faint">
              <span>{t("footer.paymentsAccepted")}</span>
              <span className="hidden h-3 w-px bg-ink-faint/40 sm:block" />
              <span>{t("footer.location")}</span>
              <span className="hidden h-3 w-px bg-ink-faint/40 sm:block" />
              <LanguageToggle />
            </div>
          </div>
        </div>
        </Reveal>
      </div>
    </footer>
  );
}
