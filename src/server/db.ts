import fs from "node:fs";
import path from "node:path";
import { hashPassword } from "./auth";
import { generateClearanceToken } from "./clearance";
import {
  syncDatabaseToSupabase,
  syncDestinationToSupabase,
  deleteDestinationFromSupabase,
  syncTourToSupabase,
  deleteTourFromSupabase,
  syncOfferToSupabase,
  deleteOfferFromSupabase,
  syncTestimonialToSupabase,
  deleteTestimonialFromSupabase,
  syncBlogPostToSupabase,
  deleteBlogPostFromSupabase,
  syncHomepageBlockToSupabase,
  syncBookingToSupabase,
  syncCustomerToSupabase,
  syncCustomerActivityToSupabase,
  syncPaymentToSupabase,
  fetchDatabaseFromSupabase,
  fetchDatabaseFromStorageBucket,
  invokeCloudSnapshotSync,
} from "./supabase";
import { normalizeImageUrl } from "@/lib/media";
import { getSupabaseAdminClient } from "@/lib/supabase";
import type {
  AboutPageCmsContent,
  DatabaseSchema,
  DbAlert,
  DbBlogPost,
  DbBooking,
  DbClearanceTicket,
  DbContactInquiry,
  DbCustomerActivity,
  DbCustomerUser,
  DbDeparture,
  DbDestination,
  DbExpense,
  DbHomepageBlock,
  DbOffer,
  DbPayment,
  DbStaffUser,
  DbSupplier,
  DbTestimonial,
  DbTour,
  HeroSlideItem,
  HomePageCmsContent,
  JournalPageCmsContent,
} from "./types";

const DB_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DB_DIR, "db.json");

let memoryDb: DatabaseSchema | null = null;

function slugToId(slug: string): string {
  // Deterministic UUID-like string from slug
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash << 5) - hash + slug.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, "0");
  return `00000000-0000-4000-8000-${hex.repeat(2).slice(0, 12)}`;
}

export function extractPromoInfo(specialRequests?: string | null): { promoCode?: string; discountAmount?: string } {
  if (!specialRequests) return {};
  const match = specialRequests.match(/\[Promo:\s*([A-Za-z0-9_\-]+)\s*\(-৳?([0-9,.]+)\)\]/i);
  if (!match) return {};
  const code = match[1];
  const discount = match[2].replace(/,/g, "");
  return { promoCode: code, discountAmount: discount };
}

function generateInitialDepartures(): DbDeparture[] {
  // Generate upcoming departures for next 4 Fridays
  const departures: DbDeparture[] = [];
  const now = new Date();
  let dayOffset = 1;
  while (departures.length < 4) {
    const d = new Date(now.getTime() + dayOffset * 24 * 60 * 60 * 1000);
    if (d.getDay() === 5) {
      // Friday
      const dateStr = d.toISOString().split("T")[0];
      departures.push({
        id: `dep-${dateStr}-${departures.length + 1}`,
        departure_date: dateStr,
        seats_remaining: Math.floor(Math.random() * 8) + 6,
        is_active: true,
      });
    }
    dayOffset++;
  }
  return departures;
}

function createSeedData(): DatabaseSchema {
  const adminAuth = hashPassword("adminpassword123");
  const financeAuth = hashPassword("financepassword123");
  const hostAuth = hashPassword("hostpassword123");

  const seededStaff: DbStaffUser[] = [
    {
      id: "usr-admin-1",
      username: "admin",
      password_hash: adminAuth.hash,
      salt: adminAuth.salt,
      role: "super_admin",
      phone_number: "+8801711000001",
      email: "admin@atithi.example.com",
      first_name: "Atithi",
      last_name: "Admin",
    },
    {
      id: "usr-finance-2",
      username: "finance_manager",
      password_hash: financeAuth.hash,
      salt: financeAuth.salt,
      role: "finance_manager",
      phone_number: "+8801711000002",
      email: "finance@atithi.example.com",
      first_name: "Mehedi",
      last_name: "Hasan",
    },
    {
      id: "usr-host-3",
      username: "host_sajek",
      password_hash: hostAuth.hash,
      salt: hostAuth.salt,
      role: "tour_host",
      phone_number: "+8801711000003",
      email: "host.sajek@atithi.example.com",
      first_name: "Tanvir",
      last_name: "Hasan",
    },
  ];

  const seededHomepageBlocks: DbHomepageBlock[] = [
    {
      id: "block-hero-1",
      block_type: "hero",
      display_order: 1,
      content: {
        eyebrow: "Domestic tours across Bangladesh",
        headline: "Discover Bangladesh,",
        highlight: "your way",
        subheadline: "Curated domestic tours. Trusted local hosts. Book with an advance and clear the balance on tour day.",
        primary_cta_label: "Explore Tours",
        primary_cta_href: "/tours",
        secondary_cta_label: "Plan My Trip",
        secondary_cta_href: "/contact",
      },
    },
    {
      id: "block-dest-grid-2",
      block_type: "destination_grid",
      display_order: 2,
      content: { hidden: false },
    },
    {
      id: "block-tours-3",
      block_type: "featured_tours",
      display_order: 3,
      content: { hidden: false },
    },
    {
      id: "block-testimonials-4",
      block_type: "testimonials",
      display_order: 4,
      content: { hidden: false },
    },
  ];

  return {
    destinations: [],
    tours: [],
    offers: [],
    testimonials: [],
    blogPosts: [],
    homepageBlocks: seededHomepageBlocks,
    staffUsers: seededStaff,
    customers: [],
    bookings: [],
    payments: [],
    clearanceTickets: [],
    alerts: [],
    expenses: [],
    suppliers: [],
    contactInquiries: [],
  };
}

let lastDbMtime = 0;
let lastSupabaseFetch = 0;
let isFetchingSupabase = false;

async function getCloudDatabase(): Promise<DatabaseSchema | null> {
  // Always query direct PostgreSQL tables as primary single source of truth!
  return await fetchDatabaseFromSupabase();
}

function triggerBackgroundSupabaseSync() {
  if (isFetchingSupabase) return;
  const now = Date.now();
  if (now - lastSupabaseFetch < 15000) return;
  lastSupabaseFetch = now;
  isFetchingSupabase = true;

  getCloudDatabase()
    .then((cloudDb) => {
      if (!cloudDb) return;
      if (cloudDb.destinations.length > 0 || cloudDb.tours.length > 0) {
        if (!memoryDb && fs.existsSync(DB_FILE)) {
          try {
            const raw = fs.readFileSync(DB_FILE, "utf-8");
            memoryDb = JSON.parse(raw) as DatabaseSchema;
          } catch {}
        }

        if (memoryDb) {
          // 1. Enrich existing cloud customers with local activities & preserve active/recent local customers
          const localCustMap = new Map((memoryDb.customers || []).map((c) => [c.id, c]));
          const cloudCustIds = new Set((cloudDb.customers || []).map((c) => c.id));
          cloudDb.customers = (cloudDb.customers || []).map((cloudC) => {
            const localC = localCustMap.get(cloudC.id);
            if (!localC) return cloudC;
            const localActs = localC.activities || [];
            const cloudActs = cloudC.activities || [];
            const actIds = new Set(cloudActs.map((a) => a.id));
            const mergedActs = [...cloudActs];
            for (const la of localActs) {
              if (!actIds.has(la.id)) mergedActs.push(la);
            }
            return {
              ...cloudC,
              activities: mergedActs,
            };
          });

          const nowMs = Date.now();
          const recentCutoffMs = 24 * 60 * 60 * 1000;
          // Preserve local customers created within the last 24 hours that are not yet in Supabase
          for (const localC of memoryDb.customers || []) {
            if (!cloudCustIds.has(localC.id)) {
              const age = nowMs - new Date(localC.created_at || nowMs).getTime();
              if (age < recentCutoffMs || isNaN(age)) {
                cloudDb.customers.unshift(localC);
                void syncCustomerToSupabase(localC);
              }
            }
          }

          // 2. Enrich existing cloud bookings with local promo_code/discount/seats/travelers & preserve active/pending/recent local bookings
          const localBookingMap = new Map((memoryDb.bookings || []).map((b) => [b.id, b]));
          const cloudBookingIds = new Set((cloudDb.bookings || []).map((b) => b.id));
          cloudDb.bookings = (cloudDb.bookings || []).map((cloudB) => {
            const localB = localBookingMap.get(cloudB.id);
            const promoInfo = extractPromoInfo(cloudB.special_requests);
            const promo_code = localB?.promo_code || cloudB.promo_code || promoInfo.promoCode || null;
            const discount_amount = localB?.discount_amount || cloudB.discount_amount || promoInfo.discountAmount || undefined;

            if (!localB) return { ...cloudB, promo_code, discount_amount };
            return {
              ...cloudB,
              promo_code,
              discount_amount,
              selected_seats:
                cloudB.selected_seats && cloudB.selected_seats.length > 0
                  ? cloudB.selected_seats
                  : localB.selected_seats || [],
              travelers:
                cloudB.travelers && cloudB.travelers.length > 0
                  ? cloudB.travelers
                  : localB.travelers,
            };
          });

          // Preserve any in-flight / pending booking or recent booking created in the last 24 hours
          for (const localB of memoryDb.bookings || []) {
            if (!cloudBookingIds.has(localB.id)) {
              const age = nowMs - new Date(localB.created_at || nowMs).getTime();
              const isPending = localB.status === "pending_payment";
              if (isPending || age < recentCutoffMs || isNaN(age)) {
                cloudDb.bookings.unshift(localB);
                void syncBookingToSupabase(localB);
              }
            }
          }

          if (memoryDb.payments?.length) cloudDb.payments = memoryDb.payments;
          if (memoryDb.clearanceTickets?.length) cloudDb.clearanceTickets = memoryDb.clearanceTickets;
          if (memoryDb.alerts?.length) cloudDb.alerts = memoryDb.alerts;
          if (memoryDb.contactInquiries?.length) cloudDb.contactInquiries = memoryDb.contactInquiries;

          // Preserve and enrich offers so tour-specific promo codes are retained
          const existingOffers = memoryDb?.offers?.length
            ? memoryDb.offers
            : (fs.existsSync(DB_FILE) ? (() => { try { return (JSON.parse(fs.readFileSync(DB_FILE, "utf-8")) as DatabaseSchema).offers || []; } catch { return []; } })() : []);

          if (existingOffers.length) {
            const cloudOfferMap = new Map((cloudDb.offers || []).map((o) => [o.id, o]));
            const mergedOffers = [...(cloudDb.offers || [])];
            for (const localO of existingOffers) {
              if (!cloudOfferMap.has(localO.id)) {
                mergedOffers.push(localO);
              } else {
                const idx = mergedOffers.findIndex((o) => o.id === localO.id);
                if (idx !== -1) {
                  mergedOffers[idx] = {
                    ...mergedOffers[idx],
                    tour_id: localO.tour_id ?? mergedOffers[idx].tour_id,
                    tour_slug: localO.tour_slug ?? mergedOffers[idx].tour_slug,
                    tour_title: localO.tour_title ?? mergedOffers[idx].tour_title,
                    code: localO.code ?? mergedOffers[idx].code,
                    is_active: localO.is_active !== undefined ? localO.is_active : mergedOffers[idx].is_active,
                    discount_type: localO.discount_type ?? mergedOffers[idx].discount_type,
                    discount_value: localO.discount_value ?? mergedOffers[idx].discount_value,
                    minimum_spend: localO.minimum_spend ?? mergedOffers[idx].minimum_spend,
                    valid_from: localO.valid_from ?? mergedOffers[idx].valid_from,
                    valid_until: localO.valid_until ?? mergedOffers[idx].valid_until,
                  };
                }
              }
            }
            cloudDb.offers = mergedOffers;
          }

          // Preserve CMS homepage blocks so hero background media type and live customizations are never lost
          if (memoryDb.homepageBlocks && memoryDb.homepageBlocks.length > 0) {
            const cloudBlockIds = new Set((cloudDb.homepageBlocks || []).map((b) => b.id));
            const mergedBlocks = [...(cloudDb.homepageBlocks || [])];
            for (const localB of memoryDb.homepageBlocks) {
              if (!cloudBlockIds.has(localB.id)) {
                mergedBlocks.push(localB);
              } else if (localB.id === "block-home-page" || localB.id === "block-about-page" || localB.id === "block-journal-page" || localB.id === "block-hero-1") {
                const idx = mergedBlocks.findIndex((b) => b.id === localB.id);
                if (idx !== -1) {
                  mergedBlocks[idx] = {
                    ...mergedBlocks[idx],
                    content: { ...mergedBlocks[idx].content, ...localB.content },
                  };
                }
              }
            }
            cloudDb.homepageBlocks = mergedBlocks;
          }
        }
        memoryDb = cloudDb;
        try {
          if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
          fs.writeFileSync(DB_FILE, JSON.stringify(cloudDb, null, 2), "utf-8");
          lastDbMtime = fs.statSync(DB_FILE).mtimeMs;
        } catch {}
      }
    })
    .catch((err) => console.warn("[Supabase Sync] Background sync error:", err))
    .finally(() => {
      isFetchingSupabase = false;
    });
}

export async function refreshFromSupabase(): Promise<DatabaseSchema> {
  const cloudDb = await fetchDatabaseFromSupabase();
  if (cloudDb && (cloudDb.destinations.length > 0 || cloudDb.tours.length > 0)) {
    if (memoryDb) {
      // 1. Enrich existing cloud customers with local activities & preserve active/recent local customers
      const localCustMap = new Map((memoryDb.customers || []).map((c) => [c.id, c]));
      const cloudCustIds = new Set((cloudDb.customers || []).map((c) => c.id));
      cloudDb.customers = (cloudDb.customers || []).map((cloudC) => {
        const localC = localCustMap.get(cloudC.id);
        if (!localC) return cloudC;
        const localActs = localC.activities || [];
        const cloudActs = cloudC.activities || [];
        const actIds = new Set(cloudActs.map((a) => a.id));
        const mergedActs = [...cloudActs];
        for (const la of localActs) {
          if (!actIds.has(la.id)) mergedActs.push(la);
        }
        return {
          ...cloudC,
          activities: mergedActs,
        };
      });

      const nowMs = Date.now();
      const recentCutoffMs = 24 * 60 * 60 * 1000;
      // Preserve local customers created within the last 24 hours that are not yet in Supabase
      for (const localC of memoryDb.customers || []) {
        if (!cloudCustIds.has(localC.id)) {
          const age = nowMs - new Date(localC.created_at || nowMs).getTime();
          if (age < recentCutoffMs || isNaN(age)) {
            cloudDb.customers.unshift(localC);
            void syncCustomerToSupabase(localC);
          }
        }
      }

      // 2. Enrich existing cloud bookings with local promo_code/discount/seats/travelers & preserve active/pending/recent local bookings
      const localBookingMap = new Map((memoryDb.bookings || []).map((b) => [b.id, b]));
      const cloudBookingIds = new Set((cloudDb.bookings || []).map((b) => b.id));
      cloudDb.bookings = (cloudDb.bookings || []).map((cloudB) => {
        const localB = localBookingMap.get(cloudB.id);
        const promoInfo = extractPromoInfo(cloudB.special_requests);
        const promo_code = localB?.promo_code || cloudB.promo_code || promoInfo.promoCode || null;
        const discount_amount = localB?.discount_amount || cloudB.discount_amount || promoInfo.discountAmount || undefined;

        if (!localB) return { ...cloudB, promo_code, discount_amount };
        return {
          ...cloudB,
          promo_code,
          discount_amount,
          selected_seats:
            cloudB.selected_seats && cloudB.selected_seats.length > 0
              ? cloudB.selected_seats
              : localB.selected_seats || [],
          travelers:
            cloudB.travelers && cloudB.travelers.length > 0
              ? cloudB.travelers
              : localB.travelers,
        };
      });

      // Preserve any in-flight / pending booking or recent booking created in the last 24 hours
      for (const localB of memoryDb.bookings || []) {
        if (!cloudBookingIds.has(localB.id)) {
          const age = nowMs - new Date(localB.created_at || nowMs).getTime();
          const isPending = localB.status === "pending_payment";
          if (isPending || age < recentCutoffMs || isNaN(age)) {
            cloudDb.bookings.unshift(localB);
            void syncBookingToSupabase(localB);
          }
        }
      }

      if (memoryDb.payments?.length) cloudDb.payments = memoryDb.payments;
      if (memoryDb.clearanceTickets?.length) cloudDb.clearanceTickets = memoryDb.clearanceTickets;
      if (memoryDb.alerts?.length) cloudDb.alerts = memoryDb.alerts;
      if (memoryDb.contactInquiries?.length) cloudDb.contactInquiries = memoryDb.contactInquiries;

      // Preserve and enrich offers so tour-specific promo codes are retained
      const existingOffers = memoryDb?.offers?.length
        ? memoryDb.offers
        : (fs.existsSync(DB_FILE) ? (() => { try { return (JSON.parse(fs.readFileSync(DB_FILE, "utf-8")) as DatabaseSchema).offers || []; } catch { return []; } })() : []);

      if (existingOffers.length) {
        const cloudOfferMap = new Map((cloudDb.offers || []).map((o) => [o.id, o]));
        const mergedOffers = [...(cloudDb.offers || [])];
        for (const localO of existingOffers) {
          if (!cloudOfferMap.has(localO.id)) {
            mergedOffers.push(localO);
          } else {
            const idx = mergedOffers.findIndex((o) => o.id === localO.id);
            if (idx !== -1) {
              mergedOffers[idx] = {
                ...mergedOffers[idx],
                tour_id: localO.tour_id ?? mergedOffers[idx].tour_id,
                tour_slug: localO.tour_slug ?? mergedOffers[idx].tour_slug,
                tour_title: localO.tour_title ?? mergedOffers[idx].tour_title,
                code: localO.code ?? mergedOffers[idx].code,
                is_active: localO.is_active !== undefined ? localO.is_active : mergedOffers[idx].is_active,
                discount_type: localO.discount_type ?? mergedOffers[idx].discount_type,
                discount_value: localO.discount_value ?? mergedOffers[idx].discount_value,
                minimum_spend: localO.minimum_spend ?? mergedOffers[idx].minimum_spend,
                valid_from: localO.valid_from ?? mergedOffers[idx].valid_from,
                valid_until: localO.valid_until ?? mergedOffers[idx].valid_until,
              };
            }
          }
        }
        cloudDb.offers = mergedOffers;
      }

      // Preserve CMS homepage blocks so hero background media type and live customizations are never lost
      if (memoryDb.homepageBlocks && memoryDb.homepageBlocks.length > 0) {
        const cloudBlockIds = new Set((cloudDb.homepageBlocks || []).map((b) => b.id));
        const mergedBlocks = [...(cloudDb.homepageBlocks || [])];
        for (const localB of memoryDb.homepageBlocks) {
          if (!cloudBlockIds.has(localB.id)) {
            mergedBlocks.push(localB);
          } else if (localB.id === "block-home-page" || localB.id === "block-about-page" || localB.id === "block-journal-page" || localB.id === "block-hero-1") {
            const idx = mergedBlocks.findIndex((b) => b.id === localB.id);
            if (idx !== -1) {
              mergedBlocks[idx] = {
                ...mergedBlocks[idx],
                content: { ...mergedBlocks[idx].content, ...localB.content },
              };
            }
          }
        }
        cloudDb.homepageBlocks = mergedBlocks;
      }
    }
    memoryDb = cloudDb;
    try {
      if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
      fs.writeFileSync(DB_FILE, JSON.stringify(cloudDb, null, 2), "utf-8");
      lastDbMtime = fs.statSync(DB_FILE).mtimeMs;
    } catch {}
    return cloudDb;
  }
  return loadDb();
}

function loadDb(): DatabaseSchema {
  triggerBackgroundSupabaseSync();
  try {
    if (fs.existsSync(DB_FILE)) {
      const stat = fs.statSync(DB_FILE);
      if (memoryDb && stat.mtimeMs <= lastDbMtime) {
        return memoryDb;
      }
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      memoryDb = JSON.parse(raw) as DatabaseSchema;
      if (!Array.isArray(memoryDb.homepageBlocks)) {
        memoryDb.homepageBlocks = [];
      }
      if (!Array.isArray(memoryDb.customers)) {
        memoryDb.customers = [];
      }
      lastDbMtime = stat.mtimeMs;
      return memoryDb;
    }
  } catch (err) {
    console.error("Failed to read database file, initializing from seed:", err);
  }

  if (memoryDb) {
    if (!Array.isArray(memoryDb.homepageBlocks)) {
      memoryDb.homepageBlocks = [];
    }
    if (!Array.isArray(memoryDb.customers)) {
      memoryDb.customers = [];
    }
    return memoryDb;
  }
  memoryDb = createSeedData();
  saveDb(memoryDb);
  return memoryDb;
}

async function saveDb(data: DatabaseSchema): Promise<boolean> {
  memoryDb = data;
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
    try {
      lastDbMtime = fs.statSync(DB_FILE).mtimeMs;
    } catch {
      lastDbMtime = Date.now();
    }
  } catch (err) {
    console.error("Failed to persist database file to disk:", err);
  }

  try {
    return await syncDatabaseToSupabase(data);
  } catch (err) {
    console.warn("[Supabase Sync] Cloud storage snapshot sync warning:", err);
    return false;
  }
}

export function getRawDb(): DatabaseSchema {
  return loadDb();
}

// ---------------------------------------------------------------------------
// Destinations
// ---------------------------------------------------------------------------

export function getDestinations(): DbDestination[] {
  const db = loadDb();
  return db.destinations.filter((d) => d.status === "published");
}

export function getDestinationBySlug(slug: string): DbDestination | null {
  const db = loadDb();
  return db.destinations.find((d) => d.slug === slug) || null;
}

// ---------------------------------------------------------------------------
// Tours
// ---------------------------------------------------------------------------

/**
 * Calculates all currently occupied/booked seats for a specific tour departure.
 * Gathers selected seats from all non-cancelled bookings.
 */
export function getBookedSeatsForDeparture(
  tourId: string,
  departureId?: string,
  departureDate?: string
): string[] {
  const db = loadDb();
  const bookedSet = new Set<string>();

  for (const b of db.bookings) {
    if (b.status === "cancelled" || b.status === "refunded") continue;
    if (b.tour_id !== tourId && b.tour_slug !== tourId) continue;

    const matchDepId = departureId && b.departure_id === departureId;
    const matchDepDate =
      departureDate && b.departure_date && b.departure_date.slice(0, 10) === departureDate.slice(0, 10);

    if (matchDepId || matchDepDate || (!departureId && !departureDate)) {
      if (Array.isArray(b.selected_seats)) {
        for (const seat of b.selected_seats) {
          if (seat && typeof seat === "string") bookedSet.add(seat.trim().toUpperCase());
        }
      }
    }
  }

  return Array.from(bookedSet).sort();
}

function attachDepartureSeats(tour: DbTour): DbTour {
  const totalSeats = Number(tour.total_seats) || 40;
  const rawDepartures =
    tour.departures && tour.departures.length > 0
      ? tour.departures
      : generateInitialDepartures();

  return {
    ...tour,
    total_seats: totalSeats,
    departures: rawDepartures.map((d) => {
      const booked = getBookedSeatsForDeparture(tour.id, d.id, d.departure_date);
      const depTotalSeats = d.total_seats || totalSeats;
      return {
        ...d,
        total_seats: depTotalSeats,
        seats_remaining: Math.max(0, depTotalSeats - booked.length),
        booked_seats: booked,
      };
    }),
  };
}

export function getTours(destinationSlug?: string, category?: string): DbTour[] {
  const db = loadDb();
  let results = db.tours.filter((t) => t.status === "published");

  if (destinationSlug) {
    results = results.filter((t) => t.destination_slug === destinationSlug);
  }
  if (category && category !== "All") {
    const catNorm = category.toLowerCase().replace(/[^a-z0-9]+/g, "");
    results = results.filter((t) => {
      const tourCatNorm = t.category.toLowerCase().replace(/[^a-z0-9]+/g, "");
      return tourCatNorm.includes(catNorm) || catNorm.includes(tourCatNorm);
    });
  }

  return results.map(attachDepartureSeats);
}

export function getTourBySlug(slug: string): DbTour | null {
  const db = loadDb();
  const tour = db.tours.find((t) => t.slug === slug);
  if (!tour) return null;
  return attachDepartureSeats(tour);
}

export function getTourById(id: string): DbTour | null {
  const db = loadDb();
  const tour = db.tours.find((t) => t.id === id);
  if (!tour) return null;
  return attachDepartureSeats(tour);
}

// ---------------------------------------------------------------------------
// CMS: Offers, Testimonials, Blog
// ---------------------------------------------------------------------------

export function getOffers(): DbOffer[] {
  const db = loadDb();
  return db.offers.filter((o) => o.is_active !== false);
}

export interface PromoValidationResult {
  valid: boolean;
  code?: string;
  title?: string;
  discount_type?: "percent" | "flat";
  discount_value?: string;
  discount_amount?: number;
  new_total?: number;
  error?: string;
  tour_id?: string | null;
  tour_title?: string | null;
}

export function validatePromoCode(
  code: string,
  tourId: string,
  tourSlug?: string,
  totalAmount?: number
): PromoValidationResult {
  const db = loadDb();
  if (!code || !code.trim()) {
    return { valid: false, error: "Please enter a promo code." };
  }

  const cleanCode = code.trim().toUpperCase();
  const offer = db.offers.find(
    (o) => (o.code || o.slug).toUpperCase() === cleanCode && o.is_active !== false
  );

  if (!offer) {
    return { valid: false, error: "Invalid promo code." };
  }

  const now = new Date();
  if (offer.valid_until) {
    const untilMs = offer.valid_until.length === 10
      ? new Date(`${offer.valid_until}T23:59:59.999Z`).getTime()
      : new Date(offer.valid_until).getTime();
    if (untilMs < now.getTime() - 24 * 60 * 60 * 1000) {
      return { valid: false, error: "This promo code has expired." };
    }
  }

  if (offer.valid_from) {
    const fromMs = offer.valid_from.length === 10
      ? new Date(`${offer.valid_from}T00:00:00.000Z`).getTime()
      : new Date(offer.valid_from).getTime();
    // Allow for up to 14 hours timezone difference (e.g. Asia/Dhaka is UTC+6)
    if (fromMs - 14 * 60 * 60 * 1000 > now.getTime()) {
      return { valid: false, error: "This promo code is not active yet." };
    }
  }

  // Check specific tour restriction
  const isTourRestricted = Boolean(offer.tour_id || offer.tour_slug);
  if (isTourRestricted) {
    const matchesTour =
      (offer.tour_id && (offer.tour_id === tourId || offer.tour_id === tourSlug)) ||
      (offer.tour_slug && (offer.tour_slug === tourSlug || offer.tour_slug === tourId));

    if (!matchesTour) {
      const targetTour = offer.tour_title || offer.tour_slug || "another specific tour";
      return {
        valid: false,
        error: `This promo code is only valid for "${targetTour}". It cannot be used for this tour.`,
      };
    }
  }

  const baseTotal = totalAmount || 0;
  const minSpend = parseFloat(offer.minimum_spend || "0");
  if (minSpend > 0 && baseTotal > 0 && baseTotal < minSpend) {
    return {
      valid: false,
      error: `Minimum booking spend of ৳${minSpend.toLocaleString()} is required to use promo code ${cleanCode}.`,
    };
  }

  let discountAmount = 0;
  if (offer.discount_type === "percent") {
    const pct = parseFloat(offer.discount_value || "0") || 0;
    discountAmount = Math.round((baseTotal * pct) / 100);
  } else {
    discountAmount = Math.round(parseFloat(offer.discount_value || "0") || 0);
  }

  if (baseTotal > 0) {
    discountAmount = Math.min(discountAmount, baseTotal);
  }

  const newTotal = Math.max(0, baseTotal - discountAmount);

  return {
    valid: true,
    code: offer.code || offer.slug,
    title: offer.title,
    discount_type: offer.discount_type,
    discount_value: offer.discount_value,
    discount_amount: discountAmount,
    new_total: newTotal,
    tour_id: offer.tour_id || null,
    tour_title: offer.tour_title || null,
  };
}

export function getTestimonials(onlyFeatured: boolean = false): DbTestimonial[] {
  const db = loadDb();
  if (onlyFeatured) {
    const featured = db.testimonials.filter((t) => t.is_featured);
    return featured.length > 0 ? featured : db.testimonials;
  }
  return db.testimonials;
}

export function getBlogPosts(): DbBlogPost[] {
  const db = loadDb();
  return db.blogPosts
    .filter((p) => p.status === "published" || p.is_published !== false)
    .sort((a, b) => {
      if (a.is_featured && !b.is_featured) return -1;
      if (!a.is_featured && b.is_featured) return 1;
      return (
        new Date(b.published_at || b.created_at || 0).getTime() -
        new Date(a.published_at || a.created_at || 0).getTime()
      );
    });
}

export function getBlogPostBySlug(slug: string): DbBlogPost | null {
  const db = loadDb();
  return db.blogPosts.find((p) => p.slug === slug) || null;
}

export function getHomepageBlocks(): DbHomepageBlock[] {
  const db = loadDb();
  return [...db.homepageBlocks].sort((a, b) => a.display_order - b.display_order);
}

export const DEFAULT_ABOUT_CMS: AboutPageCmsContent = {
  hero_eyebrow: "Our story",
  hero_title: "Built by people who call Bangladesh home",
  hero_subtitle:
    "Savar Tour Lover (সাভার ট্যুর লাভার) started with a simple belief: আপনার স্বপ্ন উড়তে দিন (Let your dreams fly). Booking a domestic trip shouldn't mean middlemen, vague pricing, and cash changing hands with no record. We built the agency we wished existed — local hosts, honest pricing, and transparent booking.",
  story_badge: "The Savar Tour Lover Standard",
  story_title: "Why we started",
  story_paragraphs: [
    "Most domestic travel in Bangladesh is organized through word-of-mouth recommendations, social media groups, or informal fixers. Prices shift depending on who's asking, booking confirmations are a verbal promise, and if something goes wrong, there's no recourse.",
    "We wanted something different: trips you could book with complete confidence, hosted by people from the actual communities you're visiting, with clear itineraries and receipts for every taka paid.",
    "Every route we offer is one we've traveled ourselves multiple times — staying at the same eco-cottages, riding the same wooden engine boats, and breaking bread with the same village hosts.",
  ],
  mission_title: "Our Mission",
  mission_text:
    "To connect travelers with authentic, dignified local hosting across every district of Bangladesh — backed by transparent pricing, flexible payments, and human support.",
  values: [
    {
      icon: "shield",
      title: "Radical transparency",
      description:
        "Every taka is accounted for — the price you see is the price you pay, and every payment is confirmed on both sides.",
    },
    {
      icon: "users",
      title: "Local, always",
      description:
        "No outsourced guides, no foreign templates. Every host is Bangladeshi, and every itinerary is built around real local knowledge.",
    },
    {
      icon: "heart",
      title: "Hospitality first",
      description:
        "We host you the way we'd host family, not process you like a booking number. Your dream travel is our passion.",
    },
    {
      icon: "sparkle",
      title: "Considered detail",
      description:
        "From the ridge walk only locals know to the candlelit dinner arranged without being asked — the small things are the trip.",
    },
  ],
  booking_eyebrow: "How booking works",
  booking_title: "Zero-friction, start to finish",
  booking_description:
    "From your first search to your final confirmed payment, every step is designed to remove friction and ambiguity.",
  team_eyebrow: "The team",
  team_title: "A few of the people who'll host you",
  team: [
    {
      name: "Raisa Chowdhury",
      role: "Co-founder & Head of Experience",
      bio: "Ten years guiding across the Chittagong Hill Tracts before building Atithi's tour design team.",
      scene: "sajek",
    },
    {
      name: "Tanvir Hasan",
      role: "Co-founder & Head of Operations",
      bio: "Runs the host network and on-ground logistics across all twelve destinations.",
      scene: "sundarbans",
    },
    {
      name: "Mehedi Hasan",
      role: "Head of Finance",
      bio: "Built the secure payment and booking system so every advance and balance is tracked without ambiguity.",
      scene: "coxsbazar",
    },
  ],
  payment_badge: "Payment & Confirmation",
  payment_title: "How your money is handled, end to end",
  payment_description:
    "Pay in full or pay a small advance through bKash, Nagad, Rocket, or card at booking. If you paid partially, the remaining balance is settled on the day of the tour — either online or in cash directly with your host. The moment it clears, both you and our team get a WhatsApp and email confirmation, so there's a clean record of what was paid, when, on both sides.",
  payment_cta_label: "Talk to us",
  payment_cta_href: "/contact",
  cta_title: "Ready to plan your own story?",
  cta_description:
    "Tell us where you want to go — we'll take it from there, right through to your final confirmed payment.",
  cta_label: "Plan My Trip",
  cta_href: "/contact",
};

export const DEFAULT_JOURNAL_CMS: JournalPageCmsContent = {
  header_eyebrow: "Travel Journal",
  header_title: "Stories from the road",
  header_description:
    "Field guides, food trails, and honest travel writing from our hosts and guests across Bangladesh.",
  featured_badge: "Latest story",
  empty_title: "No articles published yet",
  empty_description:
    "Stories, packing guides, and field notes will appear here once written and published from the Super Admin Panel.",
};

export function getAboutPageCms(): AboutPageCmsContent {
  const db = loadDb();
  const block = db.homepageBlocks.find(
    (b) => b.block_type === "about_page" || b.id === "block-about-page"
  );
  if (!block || !block.content) return DEFAULT_ABOUT_CMS;
  return { ...DEFAULT_ABOUT_CMS, ...(block.content as Partial<AboutPageCmsContent>) };
}

export async function saveAboutPageCms(content: Partial<AboutPageCmsContent>): Promise<DbHomepageBlock> {
  const current = getAboutPageCms();
  const merged = { ...current, ...content };
  return await saveHomepageBlock("block-about-page", "about_page", merged as Record<string, unknown>);
}

export function getJournalPageCms(): JournalPageCmsContent {
  const db = loadDb();
  const block = db.homepageBlocks.find(
    (b) => b.block_type === "journal_page" || b.id === "block-journal-page"
  );
  if (!block || !block.content) return DEFAULT_JOURNAL_CMS;
  return { ...DEFAULT_JOURNAL_CMS, ...(block.content as Partial<JournalPageCmsContent>) };
}

export async function saveJournalPageCms(content: Partial<JournalPageCmsContent>): Promise<DbHomepageBlock> {
  const current = getJournalPageCms();
  const merged = { ...current, ...content };
  return await saveHomepageBlock("block-journal-page", "journal_page", merged as Record<string, unknown>);
}

export const DEFAULT_HERO_SLIDES: HeroSlideItem[] = [];

export const DEFAULT_HOME_CMS: HomePageCmsContent = {
  // 1. Hero
  hero_media_type: "slideshow",
  hero_video_url: "",
  hero_slides: DEFAULT_HERO_SLIDES,
  hero_eyebrow: "Savar Tour Lover — আপনার স্বপ্ন উড়তে দিন",
  hero_headline: "Discover Bangladesh,",
  hero_highlight: "Let Your Dreams Fly",
  hero_subheadline: "Curated domestic tours with Savar Tour Lover. Trusted local hosts. Book with an advance and clear the balance on tour day.",
  hero_primary_cta_label: "Explore Tours",
  hero_primary_cta_href: "/tours",
  hero_secondary_cta_label: "Plan My Trip",
  hero_secondary_cta_href: "/contact",

  // 2. Destinations
  destinations_eyebrow: "Destinations",
  destinations_title: "Popular destinations across Bangladesh",
  destinations_description: "Beaches, hill tracts, mangrove forests, and tea country — pick a place, we'll handle the rest.",
  destinations_cta_label: "All destinations",
  destinations_cta_href: "/destinations",
  destinations_hidden: false,

  // 3. Tours
  tours_eyebrow: "Tour Packages",
  tours_title: "Popular tour packages",
  tours_description: "Small groups, local hosts, and everything included. Filter by place, duration, or price to find your trip in seconds.",
  tours_cta_label: "Browse all tours",
  tours_cta_href: "/tours",
  tours_hidden: false,

  // 4. Why Us
  why_us_eyebrow: "Why Savar Tour Lover",
  why_us_title: "Travel with people who call Bangladesh home",
  why_us_description: "We're not a booking platform that outsources your trip to strangers. We're local hosts who plan, accompany, and settle every detail — including your final payment, confirmed on both sides.",
  why_us_items: [
    {
      title: "Trusted local hosts",
      description: "Every tour is led by a verified Bangladeshi host who knows their district like family — not a scripted guide.",
      icon: "users",
    },
    {
      title: "Transparent pricing",
      description: "The price you see is the price you pay. No hidden fees, no last-minute 'fuel surcharges', no surprises.",
      icon: "receipt",
    },
    {
      title: "Flexible payment",
      description: "Book with a 40% advance and clear the balance on tour day — online or directly with your host, with confirmation to both sides.",
      icon: "receipt",
    },
    {
      title: "Zero-friction booking",
      description: "From browsing to e-ticket in minutes. Your voucher, digital ticket, and reminders arrive automatically on WhatsApp and email.",
      icon: "ticket",
    },
    {
      title: "Real 24/7 support",
      description: "A human answers on WhatsApp throughout your trip — not a chatbot that loops you in circles.",
      icon: "support",
    },
    {
      title: "Money, fully accounted",
      description: "Every payment is tracked end-to-end and confirmed to you and our team, so there's never a dispute about what was paid.",
      icon: "shield",
    },
  ],
  why_us_hidden: false,

  // 5. Services
  services_eyebrow: "Services",
  services_title: "Every kind of trip, handled",
  services_description: "Group or private, family or honeymoon, weekend or expedition — if it's in Bangladesh, we'll host it.",
  services_items: [
    {
      title: "Group Tours",
      description: "Curated group departures to every corner of Bangladesh, led by a local host and priced all-inclusive.",
      icon: "users",
    },
    {
      title: "Private & Custom Trips",
      description: "Your dates, your pace, your budget. We design a private itinerary around exactly what you want to do.",
      icon: "route",
    },
    {
      title: "Honeymoon Packages",
      description: "Ocean-view suites, candlelit dinners, and private moments — built for two, from arrival flowers to departure.",
      icon: "heart",
    },
    {
      title: "Family Holidays",
      description: "Kids-first pacing, safe transport, and hosts who handle the logistics so parents actually relax.",
      icon: "home",
    },
    {
      title: "Corporate Retreats",
      description: "Team trips to the hills or the coast with planning, logistics, and bonding activities handled end to end.",
      icon: "briefcase",
    },
    {
      title: "Adventure & Trekking",
      description: "Hill-tract treks, forest cruises, and off-the-map experiences with certified local guides and permits arranged.",
      icon: "mountain",
    },
  ],
  services_hidden: false,

  // 6. Offers
  offers_eyebrow: "Special Offers",
  offers_title: "A little reason to book today",
  offers_description: "Seasonal savings and group perks — applied automatically at checkout with the right code.",
  offers_hidden: false,

  // 7. Reviews
  reviews_eyebrow: "Customer Reviews",
  reviews_title: "Loved by travelers across Bangladesh",
  reviews_description: "Real words from guests who booked, travelled, and settled their balances — all in one seamless flow.",
  reviews_hidden: false,

  // 8. Journal
  journal_eyebrow: "Travel Journal",
  journal_title: "Stories from the road",
  journal_description: "Field guides, food trails, and honest travel writing from our hosts and guests.",
  journal_cta_label: "All stories",
  journal_cta_href: "/journal",
  journal_hidden: false,

  // 9. CTA Banner
  cta_eyebrow: "Savar Tour Lover — আপনার স্বপ্ন উড়তে দিন",
  cta_title: "Plan your next journey across Bangladesh",
  cta_description: "Tell us where you want to go and when — we'll design a tour around you. Book with a small advance and settle the rest on tour day.",
  cta_primary_label: "Plan My Trip",
  cta_primary_href: "/contact",
  cta_secondary_label: "Browse Tours",
  cta_secondary_href: "/tours",
  cta_hidden: false,
};

export function getHomePageCms(): HomePageCmsContent {
  const db = loadDb();
  if (!Array.isArray(db.homepageBlocks)) {
    db.homepageBlocks = [];
  }
  const block = db.homepageBlocks.find(
    (b) => b.block_type === "home_page" || b.id === "block-home-page"
  );

  // Derive dynamic hero slides ONLY from real published destinations in the database
  const dynamicHeroSlides: HeroSlideItem[] = (db.destinations || [])
    .filter((d) => d.status === "published" && d.cover_image)
    .map((d) => ({
      id: `slide-${d.slug}`,
      title: d.name,
      subtitle: d.tagline || d.description ? (d.tagline || d.description).slice(0, 70) : "",
      image_url: d.cover_image || "",
    }));

  const baseHomeCms: HomePageCmsContent = {
    ...DEFAULT_HOME_CMS,
    hero_slides: dynamicHeroSlides.length > 0 ? dynamicHeroSlides : [],
  };

  if (!block || !block.content) return baseHomeCms;
  const content = block.content as Partial<HomePageCmsContent>;
  return {
    ...baseHomeCms,
    ...content,
    hero_slides:
      Array.isArray(content.hero_slides) && content.hero_slides.length > 0
        ? content.hero_slides
        : (dynamicHeroSlides.length > 0 ? dynamicHeroSlides : []),
  };
}

export async function saveHomePageCms(content: Partial<HomePageCmsContent>): Promise<DbHomepageBlock> {
  const current = getHomePageCms();
  const merged = { ...current, ...content };
  return await saveHomepageBlock("block-home-page", "home_page", merged as Record<string, unknown>);
}

// ---------------------------------------------------------------------------
// Staff
// ---------------------------------------------------------------------------

export function findStaffByUsername(username: string): DbStaffUser | null {
  const db = loadDb();
  return db.staffUsers.find((u) => u.username.toLowerCase() === username.toLowerCase()) || null;
}

export function getStaffById(id: string): DbStaffUser | null {
  const db = loadDb();
  return db.staffUsers.find((u) => u.id === id) || null;
}

// ---------------------------------------------------------------------------
// Customers & Activities
// ---------------------------------------------------------------------------

export function normalizePhoneNumber(phone: string): string {
  if (!phone) return "";
  const cleaned = phone.trim().replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+880")) return cleaned;
  if (cleaned.startsWith("880")) return "+" + cleaned;
  if (cleaned.startsWith("0")) return "+88" + cleaned;
  if (cleaned.startsWith("1")) return "+880" + cleaned;
  return cleaned;
}

export function getCustomerByPhone(phone: string): DbCustomerUser | null {
  const db = loadDb();
  const normalized = normalizePhoneNumber(phone);
  if (!normalized) return null;
  return (
    db.customers?.find(
      (c) => normalizePhoneNumber(c.phone_number) === normalized
    ) || null
  );
}

export function getCustomerById(id: string): DbCustomerUser | null {
  const db = loadDb();
  return db.customers?.find((c) => c.id === id) || null;
}

export async function getOrCreateCustomerByPhone(input: {
  phone_number: string;
  full_name: string;
  email?: string;
}): Promise<{ customer: DbCustomerUser; isNew: boolean }> {
  const db = loadDb();
  const normalized = normalizePhoneNumber(input.phone_number);

  if (!Array.isArray(db.customers)) {
    db.customers = [];
  }

  const existing = db.customers.find(
    (c) => normalizePhoneNumber(c.phone_number) === normalized
  );

  if (existing) {
    let changed = false;
    if (input.full_name && existing.full_name !== input.full_name && existing.full_name === "Valued Traveler") {
      existing.full_name = input.full_name;
      changed = true;
    }
    if (input.email && !existing.email) {
      existing.email = input.email;
      changed = true;
    }
    existing.updated_at = new Date().toISOString();
    if (changed) {
      await saveDb(db);
      await syncCustomerToSupabase(existing);
    }
    return { customer: existing, isNew: false };
  }

  const newCustomerId = `cust-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const now = new Date().toISOString();
  const newCustomer: DbCustomerUser = {
    id: newCustomerId,
    phone_number: normalized || input.phone_number,
    full_name: input.full_name || "Valued Traveler",
    email: input.email || undefined,
    created_at: now,
    updated_at: now,
    last_login_at: now,
    activities: [
      {
        id: `act-${Date.now()}-1`,
        customer_id: newCustomerId,
        type: "account_created",
        title: "Account Created",
        description: `Welcome to Atithi! Account instantly created for ${input.full_name || "Traveler"} (${normalized || input.phone_number}).`,
        created_at: now,
      },
    ],
  };

  db.customers.unshift(newCustomer);
  await saveDb(db);
  await syncCustomerToSupabase(newCustomer);
  return { customer: newCustomer, isNew: true };
}

export async function updateCustomer(
  id: string,
  update: Partial<Pick<DbCustomerUser, "full_name" | "email">>
): Promise<DbCustomerUser | null> {
  const db = loadDb();
  if (!Array.isArray(db.customers)) return null;
  const cust = db.customers.find((c) => c.id === id);
  if (!cust) return null;

  if (update.full_name !== undefined) cust.full_name = update.full_name;
  if (update.email !== undefined) cust.email = update.email;
  cust.updated_at = new Date().toISOString();

  await addCustomerActivity(cust.id, {
    type: "profile_updated",
    title: "Profile Updated",
    description: "Profile information was updated.",
  });

  await saveDb(db);
  await syncCustomerToSupabase(cust);
  return cust;
}

export async function addCustomerActivity(
  customerId: string,
  activity: {
    type: DbCustomerActivity["type"];
    title: string;
    description: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  const db = loadDb();
  if (!Array.isArray(db.customers)) return;
  const cust = db.customers.find((c) => c.id === customerId);
  if (!cust) return;

  if (!Array.isArray(cust.activities)) {
    cust.activities = [];
  }

  const newActivity: DbCustomerActivity = {
    id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    customer_id: customerId,
    type: activity.type,
    title: activity.title,
    description: activity.description,
    metadata: activity.metadata,
    created_at: new Date().toISOString(),
  };

  cust.activities.unshift(newActivity);

  await saveDb(db);
  await syncCustomerActivityToSupabase(newActivity);
}

export function getCustomerBookings(phone: string, customerId?: string): DbBooking[] {
  const db = loadDb();
  const normalized = normalizePhoneNumber(phone);

  return db.bookings.filter((b) => {
    if (customerId && b.customer_id === customerId) return true;
    if (normalized && normalizePhoneNumber(b.customer_phone_number) === normalized) return true;
    return false;
  });
}

export interface CustomerWithDetails extends DbCustomerUser {
  bookings_count: number;
  total_spent: number;
  total_due: number;
  bookings: DbBooking[];
}

export function getAllCustomers(): CustomerWithDetails[] {
  const db = loadDb();
  if (!Array.isArray(db.customers)) {
    db.customers = [];
  }

  return db.customers.map((c) => {
    const custBookings = getCustomerBookings(c.phone_number, c.id);
    const totalSpent = custBookings.reduce(
      (acc, b) => acc + (parseFloat(b.amount_paid) || 0),
      0
    );
    const totalDue = custBookings.reduce(
      (acc, b) => acc + (parseFloat(b.amount_due) || 0),
      0
    );

    return {
      ...c,
      bookings_count: custBookings.length,
      total_spent: totalSpent,
      total_due: totalDue,
      bookings: custBookings,
    };
  });
}


// ---------------------------------------------------------------------------
// Bookings & Payments
// ---------------------------------------------------------------------------

export async function createBooking(input: {
  tour_id: string;
  departure_id?: string;
  traveler_count: number;
  payment_plan: "full" | "partial";
  customer_full_name: string;
  customer_phone_number: string;
  customer_email?: string;
  pickup_point?: string;
  special_requests?: string;
  selected_seats?: string[];
  promo_code?: string;
}): Promise<{ booking: DbBooking; customer: DbCustomerUser }> {
  const db = loadDb();
  const tour = db.tours.find((t) => t.id === input.tour_id || t.slug === input.tour_id);
  if (!tour) {
    throw new Error("Tour not found");
  }

  const selectedSeats = Array.isArray(input.selected_seats)
    ? input.selected_seats.map((s) => String(s).trim().toUpperCase()).filter(Boolean)
    : [];

  const effectiveTravelerCount =
    selectedSeats.length > 0 ? selectedSeats.length : Math.max(1, Number(input.traveler_count) || 1);

  let departure: DbDeparture | undefined;
  if (input.departure_id) {
    if (!tour.departures || tour.departures.length === 0) {
      tour.departures = generateInitialDepartures();
    }
    departure = tour.departures.find((d) => d.id === input.departure_id);
    if (!departure) {
      throw new Error("Departure date not found");
    }

    // Anti-double-booking check: ensure none of the requested seats are already taken
    if (selectedSeats.length > 0) {
      const alreadyBooked = getBookedSeatsForDeparture(tour.id, departure.id, departure.departure_date);
      const conflicts = selectedSeats.filter((seat) => alreadyBooked.includes(seat));
      if (conflicts.length > 0) {
        throw new Error(
          `Seat(s) ${conflicts.join(", ")} are already booked by another traveler. Please choose other available seats.`
        );
      }
    }

    if (departure.seats_remaining < effectiveTravelerCount) {
      throw new Error("Not enough seats remaining for this departure");
    }
    // Decrement seats remaining
    departure.seats_remaining = Math.max(0, departure.seats_remaining - effectiveTravelerCount);
  } else if (selectedSeats.length > 0) {
    const alreadyBooked = getBookedSeatsForDeparture(tour.id);
    const conflicts = selectedSeats.filter((seat) => alreadyBooked.includes(seat));
    if (conflicts.length > 0) {
      throw new Error(
        `Seat(s) ${conflicts.join(", ")} are already booked by another traveler. Please choose other available seats.`
      );
    }
  }

  const normalizedPhone = normalizePhoneNumber(input.customer_phone_number) || input.customer_phone_number;

  // Auto-create or link customer account
  const { customer } = await getOrCreateCustomerByPhone({
    phone_number: normalizedPhone,
    full_name: input.customer_full_name,
    email: input.customer_email,
  });

  const chosenPickupPoint = input.pickup_point?.trim() || tour.meeting_point || undefined;
  if (chosenPickupPoint) {
    customer.preferred_pickup_point = chosenPickupPoint;
  }

  const unitPrice = parseFloat(tour.final_price);
  const rawTotalPrice = unitPrice * effectiveTravelerCount;

  // Validate promo code and calculate discount if provided
  let appliedDiscount = 0;
  let validatedPromo: string | null = null;
  if (input.promo_code && input.promo_code.trim()) {
    const promoRes = validatePromoCode(input.promo_code, tour.id, tour.slug, rawTotalPrice);
    if (!promoRes.valid) {
      throw new Error(promoRes.error || "Invalid promo code for this tour.");
    }
    appliedDiscount = promoRes.discount_amount || 0;
    validatedPromo = promoRes.code || input.promo_code.trim().toUpperCase();
  }

  const totalPrice = Math.max(0, rawTotalPrice - appliedDiscount);
  const advancePercent = input.payment_plan === "full" ? 100 : (parseFloat(tour.advance_payment_percent) || 40);
  const advanceAmount = Math.round((totalPrice * advancePercent) / 100);

  let specialReqs = input.special_requests || "";
  if (validatedPromo && appliedDiscount > 0) {
    const promoTag = `[Promo: ${validatedPromo} (-৳${appliedDiscount.toLocaleString()})]`;
    specialReqs = specialReqs ? `${specialReqs} ${promoTag}` : promoTag;
  }

  const count = db.bookings.length + 1;
  const year = new Date().getFullYear();
  const ref = `AT-${year}-${String(count).padStart(5, "0")}`;
  const bookingId = `book-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const newBooking: DbBooking = {
    id: bookingId,
    reference: ref,
    tour_id: tour.id,
    tour_title: tour.title,
    tour_slug: tour.slug,
    destination_slug: tour.destination_slug,
    departure_id: departure?.id,
    departure_date: departure?.departure_date,
    traveler_count: effectiveTravelerCount,
    selected_seats: selectedSeats,
    pickup_point: chosenPickupPoint,
    unit_price: unitPrice.toFixed(2),
    total_price: totalPrice.toFixed(2),
    final_price: totalPrice.toFixed(2),
    payment_plan: input.payment_plan,
    advance_required_percent: advancePercent.toString(),
    advance_amount: advanceAmount.toFixed(2),
    amount_paid: "0.00",
    amount_due: totalPrice.toFixed(2),
    due_date: departure?.departure_date || new Date().toISOString().split("T")[0],
    status: "pending_payment",
    promo_code: validatedPromo,
    discount_amount: appliedDiscount.toFixed(2),
    customer_id: customer.id,
    customer_full_name: input.customer_full_name,
    customer_phone_number: normalizedPhone,
    customer_email: input.customer_email || "",
    special_requests: specialReqs,
    travelers:
      selectedSeats.length > 0
        ? selectedSeats.map((seat, idx) => ({
            id: `trav-${bookingId}-${idx + 1}`,
            full_name: idx === 0 ? input.customer_full_name : `Traveler ${idx + 1}`,
            seat_number: seat,
            is_lead_traveler: idx === 0,
          }))
        : [
            {
              id: `trav-${bookingId}-1`,
              full_name: input.customer_full_name,
              is_lead_traveler: true,
            },
          ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.bookings.unshift(newBooking);

  // Auto-alert for admin
  db.alerts.unshift({
    id: `alt-book-${Date.now()}`,
    alert_type: "new_booking",
    severity: "info",
    message: `New booking ${ref} created for ${tour.title} (${effectiveTravelerCount} traveler(s)${selectedSeats.length > 0 ? ` · Seats: ${selectedSeats.join(", ")}` : ""}${chosenPickupPoint ? ` · Pick-up: ${chosenPickupPoint}` : ""}).`,
    is_acknowledged: false,
    created_at: new Date().toISOString(),
  });

  // Log booking activity for customer
  await addCustomerActivity(customer.id, {
    type: "booking_created",
    title: `Booked ${tour.title}`,
    description: `Booking reference ${ref} created for ${effectiveTravelerCount} traveler(s)${selectedSeats.length > 0 ? ` · Seats: ${selectedSeats.join(", ")}` : ""}${chosenPickupPoint ? ` · Pick-up: ${chosenPickupPoint}` : ""}. Total: ৳${totalPrice.toLocaleString()}.`,
    metadata: {
      booking_id: bookingId,
      reference: ref,
      tour_id: tour.id,
      traveler_count: effectiveTravelerCount,
      selected_seats: selectedSeats,
      departure_date: departure?.departure_date,
      pickup_point: chosenPickupPoint,
    },
  });

  await saveDb(db);
  await syncCustomerToSupabase(customer);
  await syncBookingToSupabase(newBooking);
  return { booking: newBooking, customer };
}

export function getBookingById(id: string): DbBooking | null {
  const db = loadDb();
  return db.bookings.find((b) => b.id === id) || null;
}

export async function updateBooking(id: string, update: Partial<DbBooking>): Promise<DbBooking | null> {
  const db = loadDb();
  const index = db.bookings.findIndex((b) => b.id === id);
  if (index === -1) return null;

  db.bookings[index] = {
    ...db.bookings[index],
    ...update,
    updated_at: new Date().toISOString(),
  };
  await saveDb(db);
  await syncBookingToSupabase(db.bookings[index]);
  return db.bookings[index];
}

export async function createPayment(input: {
  booking_id: string;
  amount: string;
  payment_type: "advance" | "final" | "full";
  payment_method: "sslcommerz" | "host_cash" | "host_pos" | "customer_self_pay";
}): Promise<DbPayment> {
  const db = loadDb();
  const tranId = `TRAN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const payment: DbPayment = {
    id: `pay-${Date.now()}`,
    booking_id: input.booking_id,
    amount: input.amount,
    payment_type: input.payment_type,
    payment_method: input.payment_method,
    status: "pending",
    tran_id: tranId,
    created_at: new Date().toISOString(),
  };

  db.payments.unshift(payment);
  await saveDb(db);
  await syncPaymentToSupabase(payment);
  return payment;
}

export function getPaymentByTranId(tranId: string): DbPayment | null {
  const db = loadDb();
  return db.payments.find((p) => p.tran_id === tranId) || null;
}

export async function confirmPaymentSuccess(
  tranId: string,
  valId?: string,
  cardType?: string,
  extra?: { bookingId?: string; bookingRef?: string }
): Promise<{ payment: DbPayment; booking: DbBooking; ticket: DbClearanceTicket }> {
  const db = loadDb();
  let paymentIndex = db.payments.findIndex((p) => p.tran_id === tranId);
  if (paymentIndex === -1 && extra?.bookingId) {
    paymentIndex = db.payments.findIndex((p) => p.booking_id === extra.bookingId);
  }
  if (paymentIndex === -1) {
    const fallbackPayment: DbPayment = {
      id: `pay-${Date.now()}`,
      booking_id: extra?.bookingId || `book-${Date.now()}`,
      amount: "0.00",
      payment_type: "advance",
      payment_method: "sslcommerz",
      status: "pending",
      tran_id: tranId,
      created_at: new Date().toISOString(),
    };
    db.payments.unshift(fallbackPayment);
    paymentIndex = 0;
  }

  const payment = db.payments[paymentIndex];
  payment.status = "success";
  payment.val_id = valId || `VAL-${Date.now()}`;
  payment.card_type = cardType || "bKash";
  payment.paid_at = new Date().toISOString();

  let booking = db.bookings.find((b) => b.id === payment.booking_id);
  if (!booking && extra?.bookingId) {
    booking = db.bookings.find((b) => b.id === extra.bookingId);
  }

  // If not found in local memory, attempt direct fetch from Supabase
  if (!booking && payment.booking_id) {
    try {
      const supabase = getSupabaseAdminClient();
      const { data: remoteB } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", payment.booking_id)
        .maybeSingle();

      if (remoteB) {
        booking = {
          id: remoteB.id,
          reference: remoteB.reference || extra?.bookingRef || `AT-${remoteB.id.slice(-6).toUpperCase()}`,
          tour_id: remoteB.tour_id,
          tour_title: remoteB.tour_title,
          tour_slug: remoteB.tour_slug,
          destination_slug: remoteB.destination_slug || remoteB.tour_slug || "bangladesh",
          departure_date: remoteB.departure_date,
          traveler_count: Number(remoteB.traveler_count || 1),
          selected_seats: Array.isArray(remoteB.selected_seats) ? remoteB.selected_seats : [],
          unit_price: String(remoteB.unit_price || 0),
          total_price: String(remoteB.total_price || payment.amount || 0),
          final_price: String(remoteB.total_price || payment.amount || 0),
          payment_plan: Number(remoteB.due_on_tour_day || 0) > 0 ? "partial" : "full",
          advance_required_percent: "40",
          advance_amount: String(remoteB.advance_amount || payment.amount || 0),
          amount_paid: String(remoteB.amount_paid || 0),
          amount_due: String(remoteB.due_on_tour_day || 0),
          due_date: remoteB.departure_date || new Date().toISOString().slice(0, 10),
          status: remoteB.status || "pending_payment",
          customer_id: remoteB.customer_id || undefined,
          customer_full_name: remoteB.customer_name || "Customer",
          customer_phone_number: remoteB.customer_phone || "+8801700000000",
          customer_email: remoteB.customer_email || "",
          special_requests: remoteB.special_requests || "",
          travelers: Array.isArray(remoteB.travelers) ? remoteB.travelers : [],
          created_at: remoteB.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        db.bookings.unshift(booking);
      }
    } catch {}
  }

  // If still not found, construct a fallback booking to ensure the confirmed payment is honored
  if (!booking) {
    const fallbackRef = extra?.bookingRef || `AT-${payment.booking_id ? payment.booking_id.slice(-6).toUpperCase() : Date.now().toString().slice(-6)}`;
    booking = {
      id: payment.booking_id || `book-${Date.now()}`,
      reference: fallbackRef,
      tour_id: "tour_package",
      tour_title: "Confirmed Tour Booking",
      tour_slug: "confirmed-tour",
      destination_slug: "bangladesh",
      departure_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      traveler_count: 1,
      selected_seats: [],
      unit_price: payment.amount || "2000.00",
      total_price: payment.amount || "2000.00",
      final_price: payment.amount || "2000.00",
      payment_plan: payment.payment_type === "advance" ? "partial" : "full",
      advance_required_percent: "40",
      advance_amount: payment.amount || "2000.00",
      amount_paid: "0.00",
      amount_due: "0.00",
      due_date: new Date().toISOString().slice(0, 10),
      status: "pending_payment",
      customer_full_name: "Valued Traveler",
      customer_phone_number: "+8801700000000",
      customer_email: "traveler@savartourlover.com",
      special_requests: `Recovered from transaction ${tranId}`,
      travelers: [{ id: `trav-${Date.now()}-1`, full_name: "Valued Traveler", is_lead_traveler: true }],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.bookings.unshift(booking);
  }

  const paidAmount = parseFloat(payment.amount);
  const prevPaid = parseFloat(booking.amount_paid);
  const newPaid = prevPaid + paidAmount;
  const totalPrice = parseFloat(booking.total_price);
  const remainingDue = Math.max(0, totalPrice - newPaid);

  booking.amount_paid = newPaid.toFixed(2);
  booking.amount_due = remainingDue.toFixed(2);

  if (remainingDue <= 0) {
    booking.status = "confirmed_fully_paid";
  } else {
    booking.status = "confirmed_advance_paid";
  }

  // Ensure clearance ticket exists
  let ticket = db.clearanceTickets.find((t) => t.booking_id === booking.id);
  if (!ticket) {
    const token = generateClearanceToken(booking.id);
    const validDays = 7;
    const depDate = booking.departure_date ? new Date(booking.departure_date) : new Date();
    const expiresAt = new Date(depDate.getTime() + validDays * 24 * 60 * 60 * 1000).toISOString();

    ticket = {
      id: `ticket-${booking.id}`,
      booking_id: booking.id,
      token,
      token_expires_at: expiresAt,
      is_cleared: remainingDue <= 0,
      created_at: new Date().toISOString(),
    };
    db.clearanceTickets.unshift(ticket);
  } else if (remainingDue <= 0) {
    ticket.is_cleared = true;
    ticket.cleared_at = new Date().toISOString();
  }

  // Record staff alert
  db.alerts.unshift({
    id: `alt-pay-${Date.now()}`,
    alert_type: "payment_confirmed",
    severity: "info",
    message: `Payment of ৳${Math.round(paidAmount).toLocaleString()} received for booking ${booking.reference} (${booking.customer_full_name}).`,
    is_acknowledged: false,
    created_at: new Date().toISOString(),
  });

  // Log payment activity for customer
  const customer = getCustomerByPhone(booking.customer_phone_number);
  if (customer) {
    await addCustomerActivity(customer.id, {
      type: "payment_completed",
      title: remainingDue <= 0 ? "Full Payment Confirmed" : "Advance Payment Received",
      description: `Payment of ৳${Math.round(paidAmount).toLocaleString()} received via ${payment.card_type || payment.payment_method} for booking ${booking.reference}${booking.selected_seats?.length ? ` (Seats: ${booking.selected_seats.join(", ")})` : ""}.`,
      metadata: {
        booking_id: booking.id,
        reference: booking.reference,
        tran_id: tranId,
        amount: payment.amount,
        remaining_due: booking.amount_due,
        selected_seats: booking.selected_seats || [],
      },
    });
  }

  await saveDb(db);
  await syncPaymentToSupabase(payment);
  await syncBookingToSupabase(booking);
  return { payment, booking, ticket };
}

// ---------------------------------------------------------------------------
// Clearance
// ---------------------------------------------------------------------------

export function getClearanceTicket(bookingId: string): DbClearanceTicket | null {
  const db = loadDb();
  let ticket = db.clearanceTickets.find((t) => t.booking_id === bookingId);
  if (!ticket) {
    const booking = db.bookings.find((b) => b.id === bookingId);
    if (!booking) return null;

    const token = generateClearanceToken(booking.id);
    const validDays = 14;
    const depDate = booking.departure_date ? new Date(booking.departure_date) : new Date();
    const expiresAt = new Date(depDate.getTime() + validDays * 24 * 60 * 60 * 1000).toISOString();
    const dueNum = parseFloat(booking.amount_due);

    ticket = {
      id: `ticket-${booking.id}`,
      booking_id: booking.id,
      token,
      token_expires_at: expiresAt,
      is_cleared: dueNum <= 0 && booking.status !== "pending_payment",
      created_at: new Date().toISOString(),
    };
    db.clearanceTickets.unshift(ticket);
    void saveDb(db);
  }
  return ticket;
}


export async function clearTicketOnTourDay(
  bookingId: string,
  method: "host_verification" | "host_qr_scan" | "customer_self_pay" | "host_cash",
  staffId?: string
): Promise<{ ticket: DbClearanceTicket; booking: DbBooking }> {
  const db = loadDb();
  const ticket = db.clearanceTickets.find((t) => t.booking_id === bookingId);
  const booking = db.bookings.find((b) => b.id === bookingId);
  if (!ticket || !booking) {
    throw new Error("Ticket or booking not found");
  }

  ticket.is_cleared = true;
  ticket.cleared_at = new Date().toISOString();
  ticket.clearance_method = method;
  if (staffId) ticket.cleared_by_staff_id = staffId;

  booking.amount_paid = booking.total_price;
  booking.amount_due = "0.00";
  booking.status = "cleared_on_tour_day";

  // Log clearance activity for customer
  const customer = getCustomerByPhone(booking.customer_phone_number);
  if (customer) {
    await addCustomerActivity(customer.id, {
      type: "qr_cleared",
      title: "Tour Clearance Completed",
      description: `Booking pass verified and balance settled on tour day via ${method.replace(/_/g, " ")}.`,
      metadata: { booking_id: bookingId, clearance_method: method },
    });
  }

  await saveDb(db);
  await syncBookingToSupabase(booking);
  return { ticket, booking };
}

export async function completeDuePayment(
  bookingId: string,
  method: "sslcommerz" | "host_cash" | "host_pos" | "customer_self_pay" | "bkash" | "nagad" | "bank_transfer" = "customer_self_pay",
  amount?: string
): Promise<{ payment: DbPayment; booking: DbBooking; ticket: DbClearanceTicket }> {
  const db = loadDb();
  const booking = db.bookings.find((b) => b.id === bookingId);
  if (!booking) {
    throw new Error(`Booking ${bookingId} not found`);
  }

  const dueToPay = amount || booking.amount_due;
  const numDue = parseFloat(dueToPay);

  if (numDue <= 0) {
    let ticket = db.clearanceTickets.find((t) => t.booking_id === bookingId);
    if (!ticket) ticket = getClearanceTicket(bookingId)!;
    if (ticket) {
      ticket.is_cleared = true;
      ticket.cleared_at = ticket.cleared_at || new Date().toISOString();
      ticket.clearance_method = method === "host_cash" ? "host_cash" : "customer_self_pay";
    }
    booking.status = "confirmed_fully_paid";
    booking.updated_at = new Date().toISOString();
    await saveDb(db);
    await syncBookingToSupabase(booking);

    const existingPayment = db.payments.find((p) => p.booking_id === bookingId && p.status === "success") || {
      id: `pay-${Date.now()}`,
      booking_id: booking.id,
      amount: booking.total_price,
      payment_type: "final" as const,
      payment_method: method as any,
      status: "success" as const,
      tran_id: `TRAN-ALREADY-PAID-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    return {
      payment: existingPayment,
      booking,
      ticket: ticket || getClearanceTicket(bookingId)!,
    };
  }

  // Create payment record
  const payment = await createPayment({
    booking_id: booking.id,
    amount: dueToPay,
    payment_type: "final",
    payment_method: (method === "host_cash" ? "host_cash" : method === "host_pos" ? "host_pos" : "sslcommerz"),
  });

  // Confirm payment success
  const valId = `DUE-SETTLE-${Date.now()}`;
  const cardType = method.toUpperCase();
  const result = await confirmPaymentSuccess(payment.tran_id, valId, cardType, { bookingId: booking.id });
  return result;
}

// ---------------------------------------------------------------------------
// Alerts
// ---------------------------------------------------------------------------

export function getAlerts(isAcknowledged?: boolean): DbAlert[] {
  const db = loadDb();
  if (typeof isAcknowledged === "boolean") {
    return db.alerts.filter((a) => a.is_acknowledged === isAcknowledged);
  }
  return db.alerts;
}

export function acknowledgeAlert(id: string): boolean {
  const db = loadDb();
  const alert = db.alerts.find((a) => a.id === id);
  if (!alert) return false;
  alert.is_acknowledged = true;
  saveDb(db);
  return true;
}

// ---------------------------------------------------------------------------
// Finance Overview
// ---------------------------------------------------------------------------

export function getFinanceOverview() {
  const db = loadDb();

  const totalRevenue = db.bookings
    .filter((b) => b.status !== "cancelled" && b.status !== "refunded")
    .reduce((sum, b) => sum + parseFloat(b.amount_paid), 0);

  const totalDirectCost = db.expenses
    .filter((e) => e.category === "hotel" || e.category === "transport" || e.category === "guide")
    .reduce((sum, e) => sum + parseFloat(e.amount), 0);

  const totalOperationalExpense = db.expenses
    .filter((e) => e.category !== "hotel" && e.category !== "transport" && e.category !== "guide")
    .reduce((sum, e) => sum + parseFloat(e.amount), 0);

  const grossProfit = totalRevenue - totalDirectCost;
  const netProfit = grossProfit - totalOperationalExpense;

  const pendingAdvances = db.bookings
    .filter((b) => b.status === "pending_payment")
    .reduce((sum, b) => sum + parseFloat(b.advance_amount), 0);

  const dueOnTourDay = db.bookings
    .filter((b) => b.status === "confirmed_advance_paid")
    .reduce((sum, b) => sum + parseFloat(b.amount_due), 0);

  const supplierPayables = db.suppliers
    .filter((s) => s.is_active)
    .reduce((sum, s) => sum + parseFloat(s.outstanding_balance), 0);

  return {
    total_revenue: totalRevenue.toFixed(2),
    total_direct_cost: totalDirectCost.toFixed(2),
    total_operational_expense: totalOperationalExpense.toFixed(2),
    gross_profit: grossProfit.toFixed(2),
    net_profit: netProfit.toFixed(2),
    bookings_count: db.bookings.length,
    active_tours_count: db.tours.filter((t) => t.status === "published").length,
    pending_advances: pendingAdvances.toFixed(2),
    due_on_tour_day: dueOnTourDay.toFixed(2),
    supplier_payables: supplierPayables.toFixed(2),
  };
}

// ---------------------------------------------------------------------------
// Inquiries (Contact)
// ---------------------------------------------------------------------------

export async function createInquiry(input: {
  name: string;
  email: string;
  phone: string;
  destination: string;
  dates: string;
  trip_type: string;
  travelers: number;
  message: string;
}): Promise<DbContactInquiry> {
  const db = loadDb();
  const inquiry: DbContactInquiry = {
    id: `inq-${Date.now()}`,
    ...input,
    status: "new",
    created_at: new Date().toISOString(),
  };
  db.contactInquiries.unshift(inquiry);

  db.alerts.unshift({
    id: `alt-inq-${Date.now()}`,
    alert_type: "new_inquiry",
    severity: "info",
    message: `Trip inquiry from ${input.name} for ${input.destination || "custom destination"}.`,
    is_acknowledged: false,
    created_at: new Date().toISOString(),
  });

  await saveDb(db);
  return inquiry;
}

// ---------------------------------------------------------------------------
// Admin Management (Tours, Destinations, CMS, Blogs, Offers, Reviews)
// ---------------------------------------------------------------------------

export function getAllToursAdmin(): DbTour[] {
  const db = loadDb();
  return db.tours;
}

export async function saveTour(tourData: Partial<DbTour>): Promise<DbTour> {
  const db = loadDb();
  const id = tourData.id || `tour-${Date.now()}`;
  const index = db.tours.findIndex((t) => t.id === id);

  const basePriceNum = parseFloat(tourData.base_price || "0");
  const discountValNum = parseFloat(tourData.discount_value || "0");
  const finalPriceNum = Math.max(0, basePriceNum - discountValNum);
  const advancePercent = tourData.advance_payment_percent || "40";
  const advanceAmountNum = Math.round((finalPriceNum * parseFloat(advancePercent)) / 100);

  const defaultTour: DbTour = {
    id,
    title: tourData.title || "Untitled Tour",
    slug: tourData.slug || `tour-${Date.now()}`,
    destination_slug: tourData.destination_slug || "coxs-bazar",
    destination_name: tourData.destination_name || "Cox's Bazar",
    category: tourData.category || "group_tour",
    short_description: tourData.short_description || "",
    full_description: tourData.full_description || "",
    hero_image: tourData.hero_image ? normalizeImageUrl(tourData.hero_image) : null,
    duration_days: tourData.duration_days || 3,
    duration_nights: tourData.duration_nights || 2,
    base_price: basePriceNum.toFixed(2),
    discount_type: tourData.discount_type || "flat",
    discount_value: discountValNum.toFixed(2),
    final_price: finalPriceNum.toFixed(2),
    allow_partial_payment: tourData.allow_partial_payment !== false,
    advance_payment_percent: advancePercent,
    advance_amount: advanceAmountNum.toFixed(2),
    inclusions: tourData.inclusions || [],
    exclusions: tourData.exclusions || [],
    accommodation_notes: tourData.accommodation_notes || "",
    transportation_notes: tourData.transportation_notes || "",
    meals_notes: tourData.meals_notes || "",
    meeting_point: tourData.meeting_point || "Dhaka",
    pickup_points: Array.isArray(tourData.pickup_points)
      ? tourData.pickup_points
      : typeof (tourData as any).pickup_points === "string"
      ? String((tourData as any).pickup_points)
          .split("\n")
          .flatMap((s) => s.split(","))
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
    departure_schedule: tourData.departure_schedule || "Every Friday",
    total_seats: tourData.total_seats || 20,
    departures: tourData.departures && tourData.departures.length > 0 ? tourData.departures : generateInitialDepartures(),
    itinerary: tourData.itinerary || [],
    gallery: Array.isArray(tourData.gallery)
      ? tourData.gallery.map((g) => ({ ...g, image: normalizeImageUrl(g.image) }))
      : [],
    faqs: tourData.faqs || [],
    is_featured: Boolean(tourData.is_featured),
    status: tourData.status || "published",
  };

  if (index !== -1) {
    db.tours[index] = { ...db.tours[index], ...defaultTour };
  } else {
    db.tours.unshift(defaultTour);
  }

  await saveDb(db);
  await syncTourToSupabase(defaultTour);
  return defaultTour;
}

export async function deleteTour(id: string): Promise<boolean> {
  const db = loadDb();
  const index = db.tours.findIndex((t) => t.id === id);
  if (index === -1) return false;
  db.tours.splice(index, 1);
  await saveDb(db);
  await deleteTourFromSupabase(id);
  return true;
}

export function getAllDestinationsAdmin(): DbDestination[] {
  const db = loadDb();
  return db.destinations;
}

export async function saveDestination(destData: Partial<DbDestination>): Promise<DbDestination> {
  const db = loadDb();
  const id = destData.id || `dest-${Date.now()}`;
  const index = db.destinations.findIndex((d) => d.id === id);

  const defaultDest: DbDestination = {
    id,
    name: destData.name || "New Destination",
    slug: destData.slug || `destination-${Date.now()}`,
    division: destData.division || "chattogram",
    description: destData.description || "",
    best_time_to_visit: destData.best_time_to_visit || "October to March",
    weather_notes: destData.weather_notes || "Pleasant and breezy",
    popular_attractions: destData.popular_attractions || [],
    recommended_accommodation: destData.recommended_accommodation || "Local boutique resorts",
    travel_tips: destData.travel_tips || "",
    permits_required: destData.permits_required || "None",
    cover_image: destData.cover_image ? normalizeImageUrl(destData.cover_image) : null,
    cover_video_url: destData.cover_video_url || "",
    seo_title: destData.seo_title || `${destData.name} Travel Guide | Atithi`,
    seo_description: destData.seo_description || "",
    gallery: Array.isArray(destData.gallery)
      ? destData.gallery.map((g) => ({ ...g, image: normalizeImageUrl(g.image) }))
      : [],
    is_featured: Boolean(destData.is_featured),
    status: destData.status || "published",
  };

  if (index !== -1) {
    db.destinations[index] = { ...db.destinations[index], ...defaultDest };
  } else {
    db.destinations.unshift(defaultDest);
  }

  await saveDb(db);
  await syncDestinationToSupabase(defaultDest);
  return defaultDest;
}

export async function deleteDestination(id: string): Promise<boolean> {
  const db = loadDb();
  const index = db.destinations.findIndex((d) => d.id === id);
  if (index === -1) return false;
  db.destinations.splice(index, 1);
  await saveDb(db);
  await deleteDestinationFromSupabase(id);
  return true;
}

export function getAllBlogPostsAdmin(): DbBlogPost[] {
  const db = loadDb();
  return db.blogPosts;
}

export async function saveBlogPost(postData: Partial<DbBlogPost>): Promise<DbBlogPost> {
  const db = loadDb();
  const id = postData.id || `post-${Date.now()}`;
  const index = db.blogPosts.findIndex((p) => p.id === id);

  const rawBody = postData.body || postData.content || "";
  const defaultPost: DbBlogPost = {
    id,
    title: postData.title || "Untitled Post",
    slug: postData.slug || `post-${Date.now()}`,
    category: postData.category || { name: "Travel Tips" },
    author_name: postData.author_name || postData.author || "Atithi Editorial",
    author: postData.author || postData.author_name || "Atithi Editorial",
    cover_image: postData.cover_image
      ? normalizeImageUrl(postData.cover_image)
      : postData.hero_image
      ? normalizeImageUrl(postData.hero_image)
      : null,
    hero_image: postData.hero_image
      ? normalizeImageUrl(postData.hero_image)
      : postData.cover_image
      ? normalizeImageUrl(postData.cover_image)
      : null,
    excerpt: postData.excerpt || rawBody.slice(0, 160),
    body: rawBody,
    content: rawBody,
    read_time_minutes: Number(postData.read_time_minutes || 5),
    tags: postData.tags || [],
    published_at: postData.published_at || new Date().toISOString(),
    status: postData.status || (postData.is_published === false ? "draft" : "published"),
    is_published: postData.status ? postData.status === "published" : postData.is_published !== false,
    is_featured: Boolean(postData.is_featured),
  };

  if (index !== -1) {
    db.blogPosts[index] = { ...db.blogPosts[index], ...defaultPost };
  } else {
    db.blogPosts.unshift(defaultPost);
  }

  await saveDb(db);
  await syncBlogPostToSupabase(defaultPost);
  return defaultPost;
}

export async function deleteBlogPost(id: string): Promise<boolean> {
  const db = loadDb();
  const index = db.blogPosts.findIndex((p) => p.id === id);
  if (index === -1) return false;
  db.blogPosts.splice(index, 1);
  await saveDb(db);
  await deleteBlogPostFromSupabase(id);
  return true;
}

export function getAllOffersAdmin(): DbOffer[] {
  const db = loadDb();
  return db.offers;
}

export async function saveOffer(offerData: Partial<DbOffer>): Promise<DbOffer> {
  const db = loadDb();
  const id = offerData.id || `offer-${Date.now()}`;
  const index = db.offers.findIndex((o) => o.id === id);

  const defaultOffer: DbOffer = {
    id,
    title: offerData.title || "Special Offer",
    description: offerData.description || "",
    slug: (offerData.slug || offerData.code || "PROMO").toUpperCase(),
    code: (offerData.code || offerData.slug || "PROMO").toUpperCase(),
    discount_type: offerData.discount_type || "percent",
    discount_value: offerData.discount_value || "10",
    minimum_spend: offerData.minimum_spend || "0",
    valid_from: offerData.valid_from || new Date().toISOString().slice(0, 10),
    tour_id: offerData.tour_id || null,
    tour_slug: offerData.tour_slug || null,
    tour_title: offerData.tour_title || null,
    valid_until: offerData.valid_until || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    banner_image: offerData.banner_image ? normalizeImageUrl(offerData.banner_image) : null,
    is_active: offerData.is_active !== false,
  };

  if (index !== -1) {
    db.offers[index] = { ...db.offers[index], ...defaultOffer };
  } else {
    db.offers.unshift(defaultOffer);
  }

  await saveDb(db);
  await syncOfferToSupabase(defaultOffer);
  return defaultOffer;
}

export async function deleteOffer(id: string): Promise<boolean> {
  const db = loadDb();
  const index = db.offers.findIndex((o) => o.id === id);
  if (index === -1) return false;
  db.offers.splice(index, 1);
  await saveDb(db);
  await deleteOfferFromSupabase(id);
  return true;
}

export function getAllTestimonialsAdmin(): DbTestimonial[] {
  const db = loadDb();
  return db.testimonials;
}

export async function saveTestimonial(testData: Partial<DbTestimonial>): Promise<DbTestimonial> {
  const db = loadDb();
  const id = testData.id || `rev-${Date.now()}`;
  const index = db.testimonials.findIndex((t) => t.id === id);

  const authorPhoto = testData.author_avatar || testData.customer_photo;
  const normalizedPhoto = authorPhoto ? normalizeImageUrl(authorPhoto) : null;

  const defaultTest: DbTestimonial = {
    id,
    customer_name: testData.customer_name || testData.author_name || "Valued Guest",
    author_name: testData.author_name || testData.customer_name || "Valued Guest",
    tour_title: testData.tour_title || testData.trip_name || "Bangladesh Tour",
    trip_name: testData.trip_name || testData.tour_title || "Bangladesh Tour",
    author_location: testData.author_location || "Bangladesh",
    rating: typeof testData.rating === "number" ? testData.rating : 5,
    quote: testData.quote || "",
    customer_photo: normalizedPhoto,
    author_avatar: normalizedPhoto,
    is_featured: testData.is_featured !== false,
  };

  if (index !== -1) {
    db.testimonials[index] = { ...db.testimonials[index], ...defaultTest };
  } else {
    db.testimonials.unshift(defaultTest);
  }

  await saveDb(db);
  await syncTestimonialToSupabase(defaultTest);
  return defaultTest;
}

export async function deleteTestimonial(id: string): Promise<boolean> {
  const db = loadDb();
  const index = db.testimonials.findIndex((t) => t.id === id);
  if (index === -1) return false;
  db.testimonials.splice(index, 1);
  await saveDb(db);
  await deleteTestimonialFromSupabase(id);
  return true;
}

export async function saveHomepageBlock(id: string, blockType: DbHomepageBlock["block_type"], content: Record<string, unknown>): Promise<DbHomepageBlock> {
  const db = loadDb();
  const index = db.homepageBlocks.findIndex((b) => b.id === id);

  let targetBlock: DbHomepageBlock;
  if (index !== -1) {
    db.homepageBlocks[index].content = { ...db.homepageBlocks[index].content, ...content };
    targetBlock = db.homepageBlocks[index];
  } else {
    const newBlock: DbHomepageBlock = {
      id,
      block_type: blockType,
      display_order: db.homepageBlocks.length + 1,
      content,
    };
    db.homepageBlocks.push(newBlock);
    targetBlock = newBlock;
  }

  // Cross-link: Keep block-home-page and block-hero-1 in lockstep for hero settings
  if (id === "block-home-page") {
    const heroIdx = db.homepageBlocks.findIndex((b) => b.id === "block-hero-1");
    if (heroIdx !== -1) {
      db.homepageBlocks[heroIdx].content = {
        ...db.homepageBlocks[heroIdx].content,
        hero_media_type: content.hero_media_type,
        hero_video_url: content.hero_video_url,
        hero_slides: content.hero_slides,
        eyebrow: content.hero_eyebrow,
        headline: content.hero_headline,
        highlight: content.hero_highlight,
        subheadline: content.hero_subheadline,
        primary_cta_label: content.hero_primary_cta_label,
        primary_cta_href: content.hero_primary_cta_href,
        secondary_cta_label: content.hero_secondary_cta_label,
        secondary_cta_href: content.hero_secondary_cta_href,
      };
    }
  }

  memoryDb = db;
  await saveDb(db);
  await syncHomepageBlockToSupabase(targetBlock);
  return targetBlock;
}

export function getAllBookingsAdmin(): DbBooking[] {
  const db = loadDb();
  return db.bookings;
}

export async function updateBookingStatus(id: string, status: DbBooking["status"]): Promise<DbBooking | null> {
  const db = loadDb();
  const booking = db.bookings.find((b) => b.id === id);
  if (!booking) return null;
  booking.status = status;

  if (status === "confirmed_fully_paid" || status === "cleared_on_tour_day") {
    booking.amount_paid = booking.total_price;
    booking.amount_due = "0.00";
    let ticket = db.clearanceTickets.find((t) => t.booking_id === id);
    if (!ticket) {
      ticket = getClearanceTicket(id) || undefined;
    }
    if (ticket) {
      ticket.is_cleared = true;
      ticket.cleared_at = new Date().toISOString();
      ticket.clearance_method = status === "cleared_on_tour_day" ? "host_verification" : "verification_only";
    }
  }

  booking.updated_at = new Date().toISOString();
  await saveDb(db);
  await syncBookingToSupabase(booking);
  return booking;
}

export function getAllInquiriesAdmin(): DbContactInquiry[] {
  const db = loadDb();
  return db.contactInquiries;
}

export async function updateInquiryStatus(
  id: string,
  status: DbContactInquiry["status"],
  adminNotes?: string
): Promise<DbContactInquiry | null> {
  const db = loadDb();
  const inquiry = db.contactInquiries.find((i) => i.id === id);
  if (!inquiry) return null;
  inquiry.status = status;
  if (adminNotes !== undefined) inquiry.admin_notes = adminNotes;
  await saveDb(db);
  return inquiry;
}

/**
 * Trigger cloud rebuild of the storage snapshot mirror
 */
export async function rebuildSnapshotMirror() {
  return await invokeCloudSnapshotSync();
}


