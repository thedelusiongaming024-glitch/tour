"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { TourCard } from "@/components/TourCard";
import { Icon } from "@/components/Icon";
import type { Destination, Tour } from "@/lib/types";

interface PopularToursExplorerProps {
  tours: Tour[];
  destinations: Destination[];
}

const ANY_DURATION = "Any length";
const durationOptions = [
  ANY_DURATION,
  "1 Day",
  "2 Days / 1 Night",
  "3 Days / 2 Nights",
  "4 Days / 3 Nights",
  "5 Days / 4 Nights",
];

const priceOptions = [
  { label: "Any price", min: 0, max: Infinity },
  { label: "Under ৳20k", min: 0, max: 20000 },
  { label: "৳20k – ৳40k", min: 20000, max: 40000 },
  { label: "৳40k+", min: 40000, max: Infinity },
];

function SelectField({
  icon,
  label,
  value,
  onChange,
  options,
}: {
  icon: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="group relative flex items-center gap-2.5 rounded-2xl border border-white/70 bg-white/70 px-4 py-3 text-sm text-ink transition-colors focus-within:border-emerald/50 focus-within:bg-white">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald/10 text-emerald">
        <Icon name={icon} className="h-3.5 w-3.5" />
      </span>
      <span className="flex-1 overflow-hidden">
        <span className="block text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
          {label}
        </span>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full cursor-pointer truncate bg-transparent pr-2 text-sm font-medium text-ink outline-none"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </span>
      <Icon name="chevronDown" className="h-4 w-4 shrink-0 text-ink-faint transition-transform duration-200 group-focus-within:rotate-180" />
    </label>
  );
}

function CategoryPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
        active ? "text-white" : "text-ink-soft hover:text-ink"
      }`}
    >
      {active && (
        <motion.span
          layoutId="tour-category-active-pill"
          className="absolute inset-0 rounded-full bg-emerald-deep shadow-md"
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
        />
      )}
      <span className="relative">{label}</span>
    </button>
  );
}

export function PopularToursExplorer({
  tours,
  destinations,
}: PopularToursExplorerProps) {
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(tours.map((t) => t.category)))],
    [tours]
  );
  const placeOptions = useMemo(() => {
    const slugs = Array.from(new Set(tours.map((t) => t.destinationSlug)));
    const named = slugs
      .map((slug) => destinations.find((d) => d.slug === slug))
      .filter((d): d is Destination => Boolean(d))
      .map((d) => ({ value: d.slug, label: d.name }));
    return [{ value: "all", label: "All destinations" }, ...named];
  }, [tours, destinations]);

  const [category, setCategory] = useState("All");
  const [place, setPlace] = useState("all");
  const [duration, setDuration] = useState(ANY_DURATION);
  const [priceIdx, setPriceIdx] = useState(0);

  const filtered = useMemo(() => {
    const price = priceOptions[priceIdx];
    return tours.filter((t) => {
      if (category !== "All" && t.category !== category) return false;
      if (place !== "all" && t.destinationSlug !== place) return false;
      if (duration !== ANY_DURATION && t.duration !== duration) return false;
      const final = Math.max(0, t.startingPrice - t.discount);
      if (final < price.min || final > price.max) return false;
      return true;
    });
  }, [tours, category, place, duration, priceIdx]);

  const activeFilterCount = [
    category !== "All",
    place !== "all",
    duration !== ANY_DURATION,
    priceIdx !== 0,
  ].filter(Boolean).length;

  function clearAll() {
    setCategory("All");
    setPlace("all");
    setDuration(ANY_DURATION);
    setPriceIdx(0);
  }

  return (
    <div>
      {/* Filter bar */}
      <div className="glass glass-sweep rounded-3xl p-4 sm:p-5">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((c) => (
            <CategoryPill
              key={c}
              label={c}
              active={category === c}
              onClick={() => setCategory(c)}
            />
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <SelectField
            icon="mapPin"
            label="Place"
            value={place}
            onChange={setPlace}
            options={placeOptions}
          />
          <SelectField
            icon="calendar"
            label="Duration"
            value={duration}
            onChange={setDuration}
            options={durationOptions.map((d) => ({ value: d, label: d }))}
          />
          <SelectField
            icon="receipt"
            label="Price"
            value={String(priceIdx)}
            onChange={(v) => setPriceIdx(Number(v))}
            options={priceOptions.map((p, i) => ({
              value: String(i),
              label: p.label,
            }))}
          />
        </div>

        <AnimatePresence>
          {activeFilterCount > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 12 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.25 }}
              className="flex justify-end overflow-hidden"
            >
              <button
                type="button"
                onClick={clearAll}
                className="inline-flex items-center gap-1 rounded-full bg-coral/10 px-3 py-1.5 text-xs font-semibold text-coral transition-colors hover:bg-coral/20"
              >
                <Icon name="x" className="h-3.5 w-3.5" />
                Clear {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Result count */}
      <div className="mt-6 h-5">
        <AnimatePresence mode="wait">
          <motion.p
            key={filtered.length}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.2 }}
            className="text-sm font-medium text-ink-soft"
          >
            Showing{" "}
            <span className="font-semibold text-emerald-deep">
              {filtered.length}
            </span>{" "}
            {filtered.length === 1 ? "tour" : "tours"}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Results grid */}
      <motion.div layout className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((tour) => (
            <motion.div
              key={tour.slug}
              layout
              initial={{ opacity: 0, scale: 0.92, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: -18 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="h-full"
            >
              <TourCard tour={tour} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Empty state */}
      <AnimatePresence>
        {filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="glass mt-4 flex flex-col items-center gap-3 rounded-3xl p-12 text-center"
          >
            <motion.span
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-coral/10 text-coral"
            >
              <Icon name="mapPin" className="h-6 w-6" />
            </motion.span>
            <h3 className="font-display text-lg font-semibold text-ink">
              No tours match those filters
            </h3>
            <p className="max-w-sm text-sm text-ink-soft">
              Try widening your search, or clear the filters to see every
              package again.
            </p>
            <button type="button" onClick={clearAll} className="btn btn-emerald mt-2">
              Clear filters
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
