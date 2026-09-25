"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useSafeReducedMotion } from "@/lib/useSafeReducedMotion";
import { Icon } from "@/components/Icon";
import { SceneBackdrop } from "@/components/SceneBackdrop";
import { normalizeImageUrl } from "@/lib/media";
import type { SceneKey } from "@/lib/types";

export interface TourBannerSlide {
  id: string;
  image?: string | null;
  title: string;
  subtitle?: string;
  sceneKey?: SceneKey;
}

interface TourHeroBannerSliderProps {
  slides: TourBannerSlide[];
  tourTitle: string;
  category?: string;
  duration?: string;
  interval?: number; // ms per slide, default 5000
}

const slideVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
    scale: 1,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1.04,
    transition: {
      x: { type: "spring" as const, stiffness: 280, damping: 32 },
      opacity: { duration: 0.45 },
      scale: { duration: 7, ease: "linear" }, // Gentle cinematic Ken Burns zoom
    },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? "-100%" : "100%",
    opacity: 0,
    scale: 1,
    transition: {
      x: { type: "spring" as const, stiffness: 280, damping: 32 },
      opacity: { duration: 0.35 },
    },
  }),
};

export function TourHeroBannerSlider({
  slides,
  tourTitle,
  category,
  duration,
  interval = 5000,
}: TourHeroBannerSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [progressKey, setProgressKey] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useSafeReducedMotion();

  const totalSlides = slides.length;

  const paginate = useCallback(
    (newIndex: number, newDirection?: number) => {
      if (totalSlides <= 1) return;
      const normalizedIndex = (newIndex + totalSlides) % totalSlides;
      const dir =
        newDirection !== undefined
          ? newDirection
          : newIndex > currentIndex
          ? 1
          : -1;
      setDirection(dir);
      setCurrentIndex(normalizedIndex);
      setProgressKey((k) => k + 1);
    },
    [currentIndex, totalSlides]
  );

  const nextSlide = useCallback(() => {
    paginate(currentIndex + 1, 1);
  }, [currentIndex, paginate]);

  const prevSlide = useCallback(() => {
    paginate(currentIndex - 1, -1);
  }, [currentIndex, paginate]);

  // Auto-play timer
  useEffect(() => {
    if (isPaused || totalSlides <= 1 || isLightboxOpen) return;
    const timer = setInterval(() => {
      nextSlide();
    }, interval);
    return () => clearInterval(timer);
  }, [isPaused, totalSlides, isLightboxOpen, interval, nextSlide]);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsLightboxOpen(false);
      if (e.key === "ArrowRight") nextSlide();
      if (e.key === "ArrowLeft") prevSlide();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen, nextSlide, prevSlide]);

  if (totalSlides === 0) return null;

  const activeSlide = slides[currentIndex % totalSlides];
  const activeImage = activeSlide?.image ? normalizeImageUrl(activeSlide.image) : null;
  const isImageFailed = Boolean(activeSlide && failedImages[activeSlide.id]);

  return (
    <>
      {/* Main Banner Slider Container */}
      <div
        ref={containerRef}
        className="group relative w-full overflow-hidden rounded-3xl sm:rounded-[2rem] border border-white/60 bg-slate-900 shadow-glass-lg aspect-[16/10] sm:aspect-[21/9] min-h-[300px] sm:min-h-[420px] max-h-[520px] select-none"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        role="region"
        aria-roledescription="carousel"
        aria-label={`${tourTitle} photo gallery`}
      >
        {/* Animated Slide Canvas */}
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={activeSlide.id || currentIndex}
            custom={direction}
            variants={reduceMotion ? undefined : slideVariants}
            initial={reduceMotion ? { opacity: 0 } : "enter"}
            animate={reduceMotion ? { opacity: 1 } : "center"}
            exit={reduceMotion ? { opacity: 0 } : "exit"}
            className="absolute inset-0 h-full w-full"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_e, { offset, velocity }) => {
              const swipeThreshold = 50;
              if (offset.x < -swipeThreshold || velocity.x < -400) {
                nextSlide();
              } else if (offset.x > swipeThreshold || velocity.x > 400) {
                prevSlide();
              }
            }}
          >
            {activeImage && !isImageFailed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={activeImage}
                alt={activeSlide.title || tourTitle}
                className="h-full w-full object-cover select-none pointer-events-none"
                onError={() =>
                  setFailedImages((prev) => ({ ...prev, [activeSlide.id]: true }))
                }
              />
            ) : (
              <SceneBackdrop
                scene={{
                  key: activeSlide.sceneKey || "bandarban",
                  label: activeSlide.title,
                }}
                className="h-full w-full"
                showLabel={false}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Top Vignette Overlay for Badges */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/65 via-black/25 to-transparent z-10"
        />

        {/* Bottom Vignette Overlay for Captions and Controls */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10"
        />

        {/* Top Header Strip: Badges + Slide Counter + Controls */}
        <div className="absolute top-3.5 sm:top-5 inset-x-3.5 sm:inset-x-6 z-20 flex items-center justify-between gap-3">
          {/* Category & Tour Title Badge */}
          <div className="flex items-center gap-2">
            {category && (
              <span className="rounded-full bg-black/50 backdrop-blur-md border border-white/20 px-3 py-1 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-amber-300 shadow-sm">
                {category}
              </span>
            )}
            {duration && (
              <span className="hidden xs:inline-flex rounded-full bg-emerald-950/70 backdrop-blur-md border border-emerald-400/30 px-3 py-1 text-[11px] sm:text-xs font-semibold text-emerald-200 shadow-sm">
                ⏱️ {duration}
              </span>
            )}
          </div>

          {/* Top-Right Quick Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Slide Counter */}
            <span className="rounded-full bg-black/60 backdrop-blur-md border border-white/20 px-3 py-1 text-xs font-mono font-bold text-white shadow-sm flex items-center gap-1.5">
              <span>📷</span>
              <span>
                {currentIndex + 1} / {totalSlides}
              </span>
            </span>

            {/* Play/Pause Toggle */}
            {totalSlides > 1 && (
              <button
                type="button"
                onClick={() => setIsPaused((p) => !p)}
                aria-label={isPaused ? "Play slideshow" : "Pause slideshow"}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white/90 hover:bg-black/80 hover:text-white transition shadow-sm"
              >
                <Icon name={isPaused ? "play" : "pause"} className="h-3.5 w-3.5" />
              </button>
            )}

            {/* Lightbox / Zoom Button */}
            <button
              type="button"
              onClick={() => setIsLightboxOpen(true)}
              aria-label="View fullscreen photo"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white/90 hover:bg-black/80 hover:text-white transition shadow-sm"
            >
              <Icon name="expand" className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Animated Slide Progress Bar */}
        {totalSlides > 1 && !isPaused && (
          <div className="absolute top-0 inset-x-0 h-1 bg-white/20 z-20 overflow-hidden">
            <motion.div
              key={progressKey}
              className="h-full bg-gradient-to-r from-emerald-400 via-amber-300 to-emerald-300 shadow-sm"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: interval / 1000, ease: "linear" }}
            />
          </div>
        )}

        {/* Left & Right Navigation Chevrons */}
        {totalSlides > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                prevSlide();
              }}
              aria-label="Previous photo"
              className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-white/80 hover:bg-white text-slate-900 shadow-xl backdrop-blur-md border border-white/70 transition-all duration-200 active:scale-90 hover:scale-105 opacity-90 group-hover:opacity-100"
            >
              <Icon name="chevronLeft" className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                nextSlide();
              }}
              aria-label="Next photo"
              className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-white/80 hover:bg-white text-slate-900 shadow-xl backdrop-blur-md border border-white/70 transition-all duration-200 active:scale-90 hover:scale-105 opacity-90 group-hover:opacity-100"
            >
              <Icon name="chevronRight" className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </>
        )}

        {/* Bottom Bar: Caption + Pagination Dots */}
        <div className="absolute bottom-3.5 sm:bottom-5 inset-x-3.5 sm:inset-x-6 z-20 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3">
          {/* Active Photo Caption */}
          <div className="max-w-md">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSlide.id || currentIndex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="inline-flex flex-col rounded-xl bg-black/60 backdrop-blur-md border border-white/15 px-3 py-1.5 sm:px-4 sm:py-2 text-white shadow-md"
              >
                <span className="text-xs sm:text-sm font-semibold tracking-wide">
                  {activeSlide.title || tourTitle}
                </span>
                {activeSlide.subtitle && (
                  <span className="text-[10px] sm:text-xs text-slate-300 font-medium">
                    📍 {activeSlide.subtitle}
                  </span>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Interactive Navigation Dots */}
          {totalSlides > 1 && (
            <div className="flex items-center gap-1.5 sm:gap-2 rounded-full bg-black/50 backdrop-blur-md border border-white/15 px-3 py-1.5 shadow-md self-center sm:self-auto">
              {slides.map((s, idx) => {
                const isActive = idx === currentIndex;
                return (
                  <button
                    key={s.id || idx}
                    type="button"
                    onClick={() => paginate(idx)}
                    aria-label={`Go to slide ${idx + 1}: ${s.title}`}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      isActive
                        ? "w-7 sm:w-8 bg-amber-400 shadow-sm"
                        : "w-2 bg-white/40 hover:bg-white/70"
                    }`}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Mini Thumbnail Strip Below Banner Slider */}
      {totalSlides > 1 && (
        <div className="mt-3 flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-1">
          {slides.map((slide, idx) => {
            const isActive = idx === currentIndex;
            const thumbImg = slide.image ? normalizeImageUrl(slide.image) : null;

            return (
              <button
                key={`thumb-${slide.id || idx}`}
                type="button"
                onClick={() => paginate(idx)}
                className={`relative shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-200 h-14 w-20 sm:h-16 sm:w-24 ${
                  isActive
                    ? "border-amber-400 shadow-md ring-2 ring-amber-400/50 scale-105"
                    : "border-white/60 opacity-65 hover:opacity-100 hover:scale-100"
                }`}
                aria-label={`Show ${slide.title}`}
              >
                {thumbImg && !failedImages[slide.id] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumbImg}
                    alt={slide.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <SceneBackdrop
                    scene={{
                      key: slide.sceneKey || "bandarban",
                      label: slide.title,
                    }}
                    className="h-full w-full"
                    showLabel={false}
                  />
                )}
                {isActive && (
                  <div className="absolute inset-0 bg-amber-400/10 pointer-events-none" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 sm:p-8 select-none"
            onClick={() => setIsLightboxOpen(false)}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              aria-label="Close fullscreen view"
              className="absolute top-4 right-4 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition active:scale-95"
            >
              <Icon name="x" className="h-6 w-6" />
            </button>

            {/* Previous Photo Button */}
            {totalSlides > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  prevSlide();
                }}
                aria-label="Previous photo"
                className="absolute left-4 top-1/2 -translate-y-1/2 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition active:scale-90"
              >
                <Icon name="chevronLeft" className="h-6 w-6" />
              </button>
            )}

            {/* Next Photo Button */}
            {totalSlides > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  nextSlide();
                }}
                aria-label="Next photo"
                className="absolute right-4 top-1/2 -translate-y-1/2 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition active:scale-90"
              >
                <Icon name="chevronRight" className="h-6 w-6" />
              </button>
            )}

            {/* Lightbox Center Image */}
            <div
              className="relative max-h-[85vh] max-w-[90vw] overflow-hidden rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={`lightbox-${activeSlide.id || currentIndex}`}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col items-center"
                >
                  {activeImage && !isImageFailed ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={activeImage}
                      alt={activeSlide.title}
                      className="max-h-[75vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
                    />
                  ) : (
                    <div className="h-[60vh] w-[80vw] max-w-3xl rounded-2xl overflow-hidden">
                      <SceneBackdrop
                        scene={{
                          key: activeSlide.sceneKey || "bandarban",
                          label: activeSlide.title,
                        }}
                        className="h-full w-full"
                        showLabel={false}
                      />
                    </div>
                  )}

                  {/* Lightbox Caption & Indicator */}
                  <div className="mt-4 flex items-center justify-between w-full px-2 text-white/90">
                    <div>
                      <h4 className="text-base font-bold">{activeSlide.title}</h4>
                      {activeSlide.subtitle && (
                        <p className="text-xs text-slate-300">{activeSlide.subtitle}</p>
                      )}
                    </div>
                    <span className="font-mono text-xs font-semibold text-amber-300">
                      {currentIndex + 1} / {totalSlides}
                    </span>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
