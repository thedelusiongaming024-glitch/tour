"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { siteName, siteNameBn } from "@/data/site";

const navLinks = [
  { href: "/destinations", label: "Destinations" },
  { href: "/tours", label: "Tours" },
  { href: "/about", label: "About" },
  { href: "/journal", label: "Journal" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const reduce = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6">
      <div
        className={`glass-sweep glass mx-auto flex max-w-6xl items-center justify-between rounded-full py-3 pl-6 pr-3 transition-shadow duration-300 ${
          scrolled ? "shadow-glass-lg" : "shadow-glass"
        }`}
      >
        <Link href="/" className="group flex items-center gap-2.5">
          <motion.span
            whileHover={{ scale: 1.08, rotate: -4 }}
            transition={{ type: "spring", stiffness: 400, damping: 18 }}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald to-emerald-deep text-[13px] font-bold text-white shadow-md"
          >
            {siteName.charAt(0)}
          </motion.span>
          <span className="flex flex-col leading-none">
            <span className="font-display text-lg font-semibold tracking-wide text-ink">
              {siteName}
            </span>
            <span className="text-[11px] font-medium text-ink-faint">
              {siteNameBn} — domestic tours
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "text-emerald-deep"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="navbar-active-pill"
                    className="absolute inset-0 rounded-full bg-white/70"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <motion.div whileTap={{ scale: 0.96 }} className="hidden md:inline-flex">
            <Link href="/contact" className="btn btn-emerald !px-5 !py-2.5">
              Plan My Trip
            </Link>
          </motion.div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/60 text-ink transition-colors hover:bg-white md:hidden"
          >
            <div className="relative h-3.5 w-5">
              <span
                className={`absolute left-0 top-0 h-0.5 w-5 rounded bg-current transition-all duration-300 ${
                  open ? "top-1.5 rotate-45" : ""
                }`}
              />
              <span
                className={`absolute left-0 top-1.5 h-0.5 w-5 rounded bg-current transition-all duration-300 ${
                  open ? "opacity-0" : ""
                }`}
              />
              <span
                className={`absolute left-0 top-3 h-0.5 w-5 rounded bg-current transition-all duration-300 ${
                  open ? "top-1.5 -rotate-45" : ""
                }`}
              />
            </div>
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: reduce ? 0 : -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduce ? 0 : -12 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="glass-strong mt-3 overflow-hidden rounded-3xl md:hidden"
          >
            <motion.nav
              className="flex flex-col p-3"
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: reduce ? 0 : 0.05 } },
              }}
            >
              {[{ href: "/", label: "Home" }, ...navLinks, { href: "/contact", label: "Contact" }].map(
                (link) => {
                  const active = pathname === link.href;
                  return (
                    <motion.div
                      key={link.href}
                      variants={{
                        hidden: { opacity: 0, x: reduce ? 0 : -12 },
                        show: { opacity: 1, x: 0 },
                      }}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setOpen(false)}
                        className={`block rounded-2xl px-4 py-3.5 text-base font-medium transition-colors ${
                          active
                            ? "bg-emerald/10 text-emerald-deep"
                            : "text-ink-soft hover:bg-white/70 hover:text-ink"
                        }`}
                      >
                        {link.label}
                      </Link>
                    </motion.div>
                  );
                }
              )}
              <motion.div
                variants={{
                  hidden: { opacity: 0, x: reduce ? 0 : -12 },
                  show: { opacity: 1, x: 0 },
                }}
              >
                <Link
                  href="/contact"
                  onClick={() => setOpen(false)}
                  className="btn btn-emerald mt-3 w-full !py-3.5"
                >
                  Plan My Trip
                </Link>
              </motion.div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
