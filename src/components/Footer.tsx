"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Reveal } from "@/components/Reveal";
import { siteName, siteNameBn, siteTagline } from "@/data/site";
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
    <footer className="relative mt-auto px-4 pb-8 pt-16 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <Reveal>
        <div className="glass glass-sweep rounded-[2rem] p-8 sm:p-12">
          <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald to-emerald-deep text-[13px] font-bold text-white">
                  {siteName.charAt(0)}
                </span>
                <span className="font-display text-xl font-semibold text-ink">
                  {siteName}
                </span>
              </div>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-soft">
                {isBn
                  ? "বাংলাদেশ জুড়ে নির্বাচিত ট্যুর — নির্ভরযোগ্য লোকাল হোস্ট, স্পষ্ট মূল্য এবং সহজ কিউআর পেমেন্ট সুবিধা।"
                  : `${siteTagline}. Curated domestic tours across Bangladesh — trusted local hosts, transparent pricing, and seamless QR payment clearance.`}
              </p>
              <p className="mt-3 text-xs font-medium text-ink-faint">
                {siteNameBn} {t("footer.brandSpirit")}
              </p>
            </div>

            {Object.entries(footerNav).map(([title, links]) => (
              <div key={title}>
                <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-ink">
                  {title}
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="inline-block text-sm text-ink-soft transition-all duration-200 hover:translate-x-1 hover:text-emerald"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="hairline my-8" />

          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <p className="text-xs text-ink-faint">
              © {new Date().getFullYear()} {siteName}. {t("footer.allRightsReserved")}
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-ink-faint">
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
