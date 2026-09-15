"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { SceneBackdrop } from "@/components/SceneBackdrop";
import { Icon } from "@/components/Icon";
import { useLanguage } from "@/context/LanguageContext";
import type { Destination } from "@/lib/types";

interface DestinationCardProps {
  destination: Destination;
}

export function DestinationCard({ destination }: DestinationCardProps) {
  const { isBn } = useLanguage();
  const primaryName = isBn && destination.bn ? destination.bn : destination.name;
  const secondaryName = isBn && destination.bn ? destination.name : destination.bn;

  return (
    <GlassCard className="group relative overflow-hidden rounded-3xl shadow-glass transition-shadow duration-300 hover:shadow-glass-lg">
      <Link href={`/destinations/${destination.slug}`} className="block">
        <SceneBackdrop
          scene={destination.cover}
          className="aspect-[4/5] transition-transform duration-700 ease-out group-hover:scale-105"
          showLabel={false}
        />

        {/* Glass info bar */}
        <div className="glass glass-sweep absolute inset-x-3 bottom-3 flex items-end justify-between rounded-2xl p-4">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
              {destination.region}
            </span>
            <h3 className="font-display text-lg font-semibold leading-tight text-ink">
              {primaryName}
            </h3>
            {secondaryName && (
              <span className="text-xs text-ink-faint">{secondaryName}</span>
            )}
          </div>
          <motion.span
            whileHover={{ x: 4 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald/90 text-white"
          >
            <Icon name="arrowRight" className="h-4 w-4" />
          </motion.span>
        </div>
      </Link>
    </GlassCard>
  );
}
