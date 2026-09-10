"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { SceneBackdrop } from "@/components/SceneBackdrop";
import { getScene } from "@/lib/scenes";
import type { SceneKey } from "@/lib/types";

interface HeroSlideshowProps {
  scenes: SceneKey[];
  /** Milliseconds each slide is shown */
  interval?: number;
}

export function HeroSlideshow({ scenes, interval = 6000 }: HeroSlideshowProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce || paused || scenes.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % scenes.length);
    }, interval);
    return () => clearInterval(id);
  }, [reduce, paused, scenes.length, interval]);

  const activeKey = scenes[index];
  const active = getScene(activeKey);

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Cross-fading scene layers with a slow Ken Burns drift */}
      <AnimatePresence initial={false}>
        <motion.div
          key={activeKey}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className="h-full w-full"
            initial={{ scale: reduce ? 1 : 1 }}
            animate={{ scale: reduce ? 1 : 1.07 }}
            transition={{ duration: (interval + 1400) / 1000, ease: "linear" }}
          >
            <SceneBackdrop scene={{ key: activeKey, label: active.name }} className="h-full w-full" showLabel={false} />
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Pearl halo behind the headline so text stays legible over any scene */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 55% at 50% 32%, rgba(247,250,249,0.94) 0%, rgba(247,250,249,0.68) 40%, rgba(247,250,249,0.22) 68%, rgba(247,250,249,0) 88%)",
        }}
      />

      {/* Fade to page background at the bottom edge */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-2/5"
        style={{
          background:
            "linear-gradient(to top, var(--color-pearl) 0%, rgba(247,250,249,0.75) 35%, rgba(247,250,249,0) 100%)",
        }}
      />

      {/* Soft wash at the very top for navbar contrast */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-28"
        style={{
          background:
            "linear-gradient(to bottom, rgba(247,250,249,0.55) 0%, rgba(247,250,249,0) 100%)",
        }}
      />

      {/* Now-showing label */}
      <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-3 px-4 sm:bottom-8">
        <AnimatePresence mode="wait">
          <motion.span
            key={activeKey}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.4 }}
            className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-deep"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            {active.name}
            {active.motif ? ` · ${active.motif}` : ""}
          </motion.span>
        </AnimatePresence>

        {/* Progress dots */}
        <div className="flex items-center gap-2">
          {scenes.map((key, i) => (
            <button
              key={key}
              type="button"
              aria-label={`Show ${getScene(key).name}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === index
                  ? "w-7 bg-emerald-deep"
                  : "w-1.5 bg-ink/25 hover:bg-ink/45"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
