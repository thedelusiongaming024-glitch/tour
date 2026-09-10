import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { siteName, siteNameBn, siteTagline } from "@/data/site";

const footerNav = {
  Explore: [
    { href: "/destinations", label: "Destinations" },
    { href: "/tours", label: "Tour Packages" },
    { href: "/journal", label: "Travel Journal" },
    { href: "/about", label: "About Us" },
  ],
  Company: [
    { href: "/about", label: "Our Story" },
    { href: "/contact", label: "Contact" },
    { href: "/contact", label: "Plan a Custom Trip" },
    { href: "/tours", label: "Special Offers" },
  ],
  Support: [
    { href: "/contact", label: "Talk to Us" },
    { href: "/journal/sundarbans-on-a-budget-vs-luxury", label: "Travel Guides" },
    { href: "/about", label: "How Booking Works" },
    { href: "/about", label: "Payment & QR Clearance" },
  ],
};

export function Footer() {
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
                {siteTagline}. Curated domestic tours across Bangladesh — trusted
                local hosts, transparent pricing, and seamless QR payment clearance.
              </p>
              <p className="mt-3 text-xs font-medium text-ink-faint">
                {siteNameBn} — &ldquo;guest&rdquo;, in the spirit of Bengali hospitality.
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
              © {new Date().getFullYear()} {siteName}. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-xs font-medium text-ink-faint">
              <span>Payments: bKash · Nagad · Cards</span>
              <span className="hidden h-3 w-px bg-ink-faint/40 sm:block" />
              <span>Dhaka, Bangladesh 🇧🇩</span>
            </div>
          </div>
        </div>
        </Reveal>
      </div>
    </footer>
  );
}
