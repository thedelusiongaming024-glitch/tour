"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";
import { Icon } from "@/components/Icon";
import type { Service } from "@/lib/types";

interface ServiceCardProps {
  service: Service;
}

export function ServiceCard({ service }: ServiceCardProps) {
  return (
    <GlassCard
      lift={6}
      className="glass glass-sweep group flex h-full flex-col rounded-3xl p-6 shadow-glass transition-shadow duration-300 hover:shadow-glass-lg"
    >
      <motion.span
        whileHover={{ scale: 1.12, rotate: 6 }}
        transition={{ type: "spring", stiffness: 400, damping: 16 }}
        className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald to-emerald-deep text-white shadow-md"
      >
        <Icon name={service.icon} className="h-6 w-6" />
      </motion.span>
      <h3 className="mt-4 font-display text-lg font-semibold text-ink">
        {service.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        {service.description}
      </p>
    </GlassCard>
  );
}
