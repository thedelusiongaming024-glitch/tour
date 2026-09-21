"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { SceneBackdrop } from "@/components/SceneBackdrop";
import { Icon } from "@/components/Icon";
import { useLanguage } from "@/context/LanguageContext";
import type { Tour } from "@/lib/types";

interface TourCardProps {
  tour: Tour;
  /** Show the discounted price; otherwise the starting price */
  showDiscount?: boolean;
}

export function TourCard({ tour, showDiscount = true }: TourCardProps) {
  const { t, formatPrice, formatNumber, isBn } = useLanguage();
  const original = tour.startingPrice;
  const final = Math.max(0, original - tour.discount);

  const displayDuration = isBn
    ? tour.duration
        .replace(/Days?/gi, "দিন")
        .replace(/Nights?/gi, "রাত")
        .replace(/\d+/g, (m) => formatNumber(Number(m)))
    : tour.duration;

  return (
    <GlassCard className="group flex h-full flex-col overflow-hidden rounded-3xl shadow-glass transition-shadow duration-300 hover:shadow-glass-lg">
      <Link href={`/tours/${tour.slug}`} className="flex flex-1 flex-col">
        <div className="relative">
          <SceneBackdrop
            scene={tour.cover}
            className="aspect-[16/10] transition-transform duration-700 ease-out group-hover:scale-105"
            showLabel={false}
          />
          <div className="absolute left-3 top-3 flex flex-col gap-2">
            <span className="rounded-full bg-ink/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white backdrop-blur">
              {tour.category}
            </span>
            {showDiscount && tour.discount > 0 && (
              <span className="rounded-full bg-coral/90 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur">
                {t("card.save")} {formatPrice(tour.discount)}
              </span>
            )}
          </div>
        </div>

        <div className="glass glass-sweep flex flex-1 flex-col gap-3 rounded-b-3xl p-5">
          <div className="flex items-center gap-2 text-xs font-medium text-ink-faint">
            <span className="inline-flex items-center gap-1">
              <Icon name="clock" className="h-3.5 w-3.5" />
              {displayDuration}
            </span>
            <span className="h-1 w-1 rounded-full bg-ink-faint/50" />
            <span className="inline-flex items-center gap-1">
              <Icon name="mapPin" className="h-3.5 w-3.5" />
              {tour.departure}
            </span>
          </div>

          <h3 className="font-display text-lg font-semibold leading-snug text-ink transition-colors group-hover:text-emerald-deep">
            {tour.title}
          </h3>
          <p className="text-sm leading-relaxed text-ink-soft">{tour.summary}</p>

          <div className="mt-auto flex items-end justify-between border-t border-white/60 pt-3">
            <div>
              {showDiscount && tour.discount > 0 ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-sm text-ink-faint line-through">
                    {formatPrice(original)}
                  </span>
                  <span className="font-display text-xl font-semibold text-emerald-deep">
                    {formatPrice(final)}
                  </span>
                </div>
              ) : (
                <span className="font-display text-xl font-semibold text-emerald-deep">
                  {formatPrice(original)}
                </span>
              )}
              <span className="text-[11px] text-ink-faint">
                {t("card.perPerson")} · {t("card.bookFrom")}{" "}
                {formatNumber(tour.advancePercent)}% {t("card.advanceBadge")}
              </span>
            </div>
            <motion.span
              whileHover={{ x: 4 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald/90 text-white"
            >
              <Icon name="arrowRight" className="h-4 w-4" />
            </motion.span>
          </div>
        </div>
      </Link>
    </GlassCard>
  );
}
