"use client";

import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { useSafeReducedMotion } from "@/lib/useSafeReducedMotion";

const BLUR_DATA_URL =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABQODxIPDRQSEBIXFRQYHjIhHhwcHj0sLiQySUBMS0dARkVQWnNiUFVtVkVGZIhlbXd7gYKBTmCNl4x9lnN+gXz/2wBDARUXFx4aHjshITt8U0ZTfHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHx8fHz/wAARCAALABADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwAtLBM4IB+lbNvbW8eAxAPua4uyvLhI/llYc1Ne3c+3Hmtg9eaJJslOx//Z";

/**
 * Sitewide atmospheric backdrop — the misty mountain photograph, pinned to
 * the viewport (position: fixed) so it holds still while every page scrolls
 * over it. All glass panels sit above this and pick up its colour and light
 * the same way they'd catch a real window behind frosted glass.
 *
 * Layered on top of the photo:
 *  - a slow scroll-linked drift + zoom (paused for prefers-reduced-motion)
 *  - a dark scrim at the very top so the floating navbar keeps contrast
 *  - an emerald/gold colour-grade wash tying the photo to the brand palette
 *  - a soft pearl haze so body text anywhere on the site stays legible
 */
export function SiteBackdrop() {
  const reduce = useSafeReducedMotion();
  const { scrollYProgress } = useScroll();

  // Gentle parallax: the photo drifts and breathes very slowly as the
  // whole document is scrolled, instead of sitting perfectly static.
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, -40]);
  const scale = useTransform(scrollYProgress, [0, 1], reduce ? [1, 1] : [1.08, 1.16]);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-10 overflow-hidden bg-mist"
    >
      <motion.div className="absolute inset-0" style={{ y, scale }}>
        <Image
          src="/images/mountain-hero.jpg"
          alt=""
          fill
          priority
          quality={75}
          placeholder="blur"
          blurDataURL={BLUR_DATA_URL}
          sizes="100vw"
          className="object-cover object-[65%_40%]"
        />
      </motion.div>

      {/* Brand colour-grade — ties the neutral photo to the emerald/gold palette */}
      <div
        className="absolute inset-0 mix-blend-soft-light"
        style={{
          background:
            "linear-gradient(155deg, rgba(10,79,62,0.4) 0%, rgba(14,107,85,0.12) 35%, rgba(201,153,63,0.1) 68%, rgba(201,153,63,0.22) 100%)",
        }}
      />

      {/* Dark scrim at the top so the floating glass navbar keeps contrast */}
      <div
        className="absolute inset-x-0 top-0 h-48"
        style={{
          background:
            "linear-gradient(to bottom, rgba(6,20,17,0.45) 0%, rgba(6,20,17,0.12) 60%, transparent 100%)",
        }}
      />

      {/* Pearl haze — a light wash, not a cover-up: keeps body copy legible
          without hiding the photo the way the previous, heavier version did */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(238,242,244,0.08) 0%, rgba(238,242,244,0.22) 35%, rgba(238,242,244,0.4) 68%, rgba(238,242,244,0.5) 100%)",
        }}
      />

      {/* Faint vignette for depth at the edges */}
      <div
        className="absolute inset-0"
        style={{
          boxShadow: "inset 0 0 18vw rgba(6,20,17,0.28)",
        }}
      />
    </div>
  );
}
