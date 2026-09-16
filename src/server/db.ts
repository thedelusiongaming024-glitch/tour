import fs from "node:fs";
import path from "node:path";
import { destinations as staticDestinations } from "@/data/destinations";
import { tours as staticTours } from "@/data/tours";
import { journalPosts as staticJournalPosts } from "@/data/journal";
import { specialOffers as staticSpecialOffers, reviews as staticReviews } from "@/data/site";
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
} from "./supabase";
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

function triggerBackgroundSupabaseSync() {
  if (isFetchingSupabase) return;
  const now = Date.now();
  if (now - lastSupabaseFetch < 15000) return;
  lastSupabaseFetch = now;
  isFetchingSupabase = true;

  fetchDatabaseFromSupabase()
    .then((cloudDb) => {
      if (!cloudDb) return;
      if (cloudDb.destinations.length > 0 || cloudDb.tours.length > 0) {
        if (memoryDb) {
          // Merge destinations
          const mergedDestinations = [...cloudDb.destinations];
          const onlineDestSlugs = new Set(mergedDestinations.map((d) => d.slug));
          for (const localDest of memoryDb.destinations || []) {
            if (!onlineDestSlugs.has(localDest.slug)) {
              mergedDestinations.push(localDest);
            }
          }
          cloudDb.destinations = mergedDestinations;

          // Merge tours
          const mergedTours = [...cloudDb.tours];
          const onlineTourSlugs = new Set(mergedTours.map((t) => t.slug));
          for (const localTour of memoryDb.tours || []) {
            if (!onlineTourSlugs.has(localTour.slug)) {
              mergedTours.push(localTour);
            }
          }
          cloudDb.tours = mergedTours;

          // Merge blog posts
          const mergedBlogs = [...cloudDb.blogPosts];
          const onlineBlogSlugs = new Set(mergedBlogs.map((b) => b.slug));
          for (const localBlog of memoryDb.blogPosts || []) {
            if (!onlineBlogSlugs.has(localBlog.slug)) {
              mergedBlogs.push(localBlog);
            }
          }
          cloudDb.blogPosts = mergedBlogs;

          // Merge customers: Supabase is authoritative.
          // Only keep local customers that were created within the last 60 seconds (in-flight sync)
          const oneMinuteAgo = Date.now() - 60000;
          const mergedCustomers = [...(cloudDb.customers || [])];
          const onlineCustIds = new Set(mergedCustomers.map((c) => c.id));
          for (const localCust of memoryDb.customers || []) {
            if (!onlineCustIds.has(localCust.id)) {
              const createdAt = new Date(localCust.created_at || 0).getTime();
              if (createdAt > oneMinuteAgo) {
                mergedCustomers.push(localCust);
              }
            }
          }
          cloudDb.customers = mergedCustomers;

          // Merge bookings: Supabase is authoritative.
          const mergedBookings = [...(cloudDb.bookings || [])];
          const onlineBookingIds = new Set(mergedBookings.map((b) => b.id));
          for (const localBooking of memoryDb.bookings || []) {
            if (!onlineBookingIds.has(localBooking.id)) {
              const createdAt = new Date(localBooking.created_at || 0).getTime();
              if (createdAt > oneMinuteAgo) {
                mergedBookings.push(localBooking);
              }
            }
          }
          cloudDb.bookings = mergedBookings;

          if (memoryDb.payments?.length) cloudDb.payments = memoryDb.payments;
          if (memoryDb.clearanceTickets?.length) cloudDb.clearanceTickets = memoryDb.clearanceTickets;
          if (memoryDb.alerts?.length) cloudDb.alerts = memoryDb.alerts;
          if (memoryDb.contactInquiries?.length) cloudDb.contactInquiries = memoryDb.contactInquiries;
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
      const mergedDestinations = [...cloudDb.destinations];
      const onlineDestSlugs = new Set(mergedDestinations.map((d) => d.slug));
      for (const localDest of memoryDb.destinations || []) {
        if (!onlineDestSlugs.has(localDest.slug)) {
          mergedDestinations.push(localDest);
        }
      }
      cloudDb.destinations = mergedDestinations;

      const mergedTours = [...cloudDb.tours];
      const onlineTourSlugs = new Set(mergedTours.map((t) => t.slug));
      for (const localTour of memoryDb.tours || []) {
        if (!onlineTourSlugs.has(localTour.slug)) {
          mergedTours.push(localTour);
        }
      }
      cloudDb.tours = mergedTours;

      const mergedBlogs = [...cloudDb.blogPosts];
      const onlineBlogSlugs = new Set(mergedBlogs.map((b) => b.slug));
      for (const localBlog of memoryDb.blogPosts || []) {
        if (!onlineBlogSlugs.has(localBlog.slug)) {
          mergedBlogs.push(localBlog);
        }
      }
      cloudDb.blogPosts = mergedBlogs;

      const oneMinuteAgo = Date.now() - 60000;
      const mergedCustomers = [...(cloudDb.customers || [])];
      const onlineCustIds = new Set(mergedCustomers.map((c) => c.id));
      for (const localCust of memoryDb.customers || []) {
        if (!onlineCustIds.has(localCust.id)) {
          const createdAt = new Date(localCust.created_at || 0).getTime();
          if (createdAt > oneMinuteAgo) {
            mergedCustomers.push(localCust);
          }
        }
      }
      cloudDb.customers = mergedCustomers;

      const mergedBookings = [...(cloudDb.bookings || [])];
      const onlineBookingIds = new Set(mergedBookings.map((b) => b.id));
      for (const localBooking of memoryDb.bookings || []) {
        if (!onlineBookingIds.has(localBooking.id)) {
          const createdAt = new Date(localBooking.created_at || 0).getTime();
          if (createdAt > oneMinuteAgo) {
            mergedBookings.push(localBooking);
          }
        }
      }
      cloudDb.bookings = mergedBookings;

      if (memoryDb.payments?.length) cloudDb.payments = memoryDb.payments;
      if (memoryDb.clearanceTickets?.length) cloudDb.clearanceTickets = memoryDb.clearanceTickets;
      if (memoryDb.alerts?.length) cloudDb.alerts = memoryDb.alerts;
      if (memoryDb.contactInquiries?.length) cloudDb.contactInquiries = memoryDb.contactInquiries;
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

function saveDb(data: DatabaseSchema) {
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

  // Non-blocking cloud synchronization to online Supabase
  syncDatabaseToSupabase(data).catch((err) => {
    console.warn("[Supabase Sync] Background cloud sync warning:", err);
  });
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

  return results;
}

export function getTourBySlug(slug: string): DbTour | null {
  const db = loadDb();
  return db.tours.find((t) => t.slug === slug) || null;
}

export function getTourById(id: string): DbTour | null {
  const db = loadDb();
  return db.tours.find((t) => t.id === id) || null;
}

// ---------------------------------------------------------------------------
// CMS: Offers, Testimonials, Blog
// ---------------------------------------------------------------------------

export function getOffers(): DbOffer[] {
  const db = loadDb();
  return db.offers.filter((o) => o.is_active);
}

export function getTestimonials(onlyFeatured: boolean = false): DbTestimonial[] {
  const db = loadDb();
  if (onlyFeatured) {
    return db.testimonials.filter((t) => t.is_featured);
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
    "Atithi (অতিথি) started with a simple frustration: booking a domestic trip meant middlemen, vague pricing, and cash changing hands with no record. We built the agency we wished existed — local hosts, honest pricing, and a payment system that leaves nothing to dispute.",
  story_badge: "The Atithi Standard",
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
        'Atithi — "guest" — is central to Bengali culture. We host you the way we\'d host family, not process you like a booking number.',
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
    "From your first search to your final QR-cleared payment, every step is designed to remove friction and ambiguity.",
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
      bio: "Built the payment and QR clearance system so every advance and balance is tracked without ambiguity.",
      scene: "coxsbazar",
    },
  ],
  payment_badge: "Payment & QR clearance",
  payment_title: "How your money is handled, end to end",
  payment_description:
    "Pay in full or pay a small advance through bKash, Nagad, Rocket, or card at booking. If you paid partially, the remaining balance is settled on the day of the tour — either your host scans your personal QR code, or you log in and pay it yourself. The moment it clears, both you and our team get a WhatsApp and email confirmation, so there's a clean record of what was paid, when, on both sides.",
  payment_cta_label: "Talk to us",
  payment_cta_href: "/contact",
  cta_title: "Ready to plan your own story?",
  cta_description:
    "Tell us where you want to go — we'll take it from there, right through to the final QR-cleared payment.",
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

export function saveAboutPageCms(content: Partial<AboutPageCmsContent>): DbHomepageBlock {
  const current = getAboutPageCms();
  const merged = { ...current, ...content };
  return saveHomepageBlock("block-about-page", "about_page", merged as Record<string, unknown>);
}

export function getJournalPageCms(): JournalPageCmsContent {
  const db = loadDb();
  const block = db.homepageBlocks.find(
    (b) => b.block_type === "journal_page" || b.id === "block-journal-page"
  );
  if (!block || !block.content) return DEFAULT_JOURNAL_CMS;
  return { ...DEFAULT_JOURNAL_CMS, ...(block.content as Partial<JournalPageCmsContent>) };
}

export function saveJournalPageCms(content: Partial<JournalPageCmsContent>): DbHomepageBlock {
  const current = getJournalPageCms();
  const merged = { ...current, ...content };
  return saveHomepageBlock("block-journal-page", "journal_page", merged as Record<string, unknown>);
}

export const DEFAULT_HOME_CMS: HomePageCmsContent = {
  // 1. Hero
  hero_eyebrow: "Domestic tours across Bangladesh",
  hero_headline: "Discover Bangladesh,",
  hero_highlight: "your way",
  hero_subheadline: "Curated domestic tours. Trusted local hosts. Book with an advance and clear the balance on tour day.",
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
  why_us_eyebrow: "Why ATITHI",
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
      description: "Book with a 40% advance and clear the balance on tour day — by QR scan or online, with confirmation to both sides.",
      icon: "qr",
    },
    {
      title: "Zero-friction booking",
      description: "From browsing to e-ticket in minutes. Your voucher, QR ticket, and reminders arrive automatically on WhatsApp and email.",
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
  cta_eyebrow: "Atithi — the guest is God",
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
  if (!block || !block.content) return DEFAULT_HOME_CMS;
  return { ...DEFAULT_HOME_CMS, ...(block.content as Partial<HomePageCmsContent>) };
}

export function saveHomePageCms(content: Partial<HomePageCmsContent>): DbHomepageBlock {
  const current = getHomePageCms();
  const merged = { ...current, ...content };
  return saveHomepageBlock("block-home-page", "home_page", merged as Record<string, unknown>);
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

export function getOrCreateCustomerByPhone(input: {
  phone_number: string;
  full_name: string;
  email?: string;
}): { customer: DbCustomerUser; isNew: boolean } {
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
      saveDb(db);
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
  saveDb(db);
  syncCustomerToSupabase(newCustomer).catch((err) => console.warn("[Supabase Sync] newCustomer sync error:", err));
  return { customer: newCustomer, isNew: true };
}

export function updateCustomer(
  id: string,
  update: Partial<Pick<DbCustomerUser, "full_name" | "email">>
): DbCustomerUser | null {
  const db = loadDb();
  if (!Array.isArray(db.customers)) return null;
  const cust = db.customers.find((c) => c.id === id);
  if (!cust) return null;

  if (update.full_name !== undefined) cust.full_name = update.full_name;
  if (update.email !== undefined) cust.email = update.email;
  cust.updated_at = new Date().toISOString();

  addCustomerActivity(cust.id, {
    type: "profile_updated",
    title: "Profile Updated",
    description: "Profile information was updated.",
  });

  saveDb(db);
  syncCustomerToSupabase(cust).catch((err) => console.warn("[Supabase Sync] updateCustomer sync error:", err));
  return cust;
}

export function addCustomerActivity(
  customerId: string,
  activity: {
    type: DbCustomerActivity["type"];
    title: string;
    description: string;
    metadata?: Record<string, unknown>;
  }
): void {
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

  saveDb(db);
  syncCustomerActivityToSupabase(newActivity).catch((err) => console.warn("[Supabase Sync] addCustomerActivity sync error:", err));
}

export function getCustomerBookings(phone: string): DbBooking[] {
  const db = loadDb();
  const normalized = normalizePhoneNumber(phone);
  if (!normalized) return [];

  return db.bookings.filter(
    (b) => normalizePhoneNumber(b.customer_phone_number) === normalized
  );
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
    const custBookings = getCustomerBookings(c.phone_number);
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

export function createBooking(input: {
  tour_id: string;
  departure_id?: string;
  traveler_count: number;
  payment_plan: "full" | "partial";
  customer_full_name: string;
  customer_phone_number: string;
  customer_email?: string;
  special_requests?: string;
}): { booking: DbBooking; customer: DbCustomerUser } {
  const db = loadDb();
  const tour = db.tours.find((t) => t.id === input.tour_id);
  if (!tour) {
    throw new Error("Tour not found");
  }

  let departure: DbDeparture | undefined;
  if (input.departure_id) {
    departure = tour.departures.find((d) => d.id === input.departure_id);
    if (!departure) {
      throw new Error("Departure date not found");
    }
    if (departure.seats_remaining < input.traveler_count) {
      throw new Error("Not enough seats remaining for this departure");
    }
    // Decrement seats remaining
    departure.seats_remaining -= input.traveler_count;
  }

  const normalizedPhone = normalizePhoneNumber(input.customer_phone_number) || input.customer_phone_number;

  // Auto-create or link customer account
  const { customer } = getOrCreateCustomerByPhone({
    phone_number: normalizedPhone,
    full_name: input.customer_full_name,
    email: input.customer_email,
  });

  const unitPrice = parseFloat(tour.final_price);
  const totalPrice = unitPrice * input.traveler_count;
  const advancePercent = input.payment_plan === "full" ? 100 : parseFloat(tour.advance_payment_percent);
  const advanceAmount = Math.round((totalPrice * advancePercent) / 100);
  const amountDue = totalPrice - (input.payment_plan === "full" ? 0 : 0); // initial: full price due until payment

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
    traveler_count: input.traveler_count,
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
    customer_id: customer.id,
    customer_full_name: input.customer_full_name,
    customer_phone_number: normalizedPhone,
    customer_email: input.customer_email || "",
    special_requests: input.special_requests || "",
    travelers: [
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
    message: `New booking ${ref} created for ${tour.title} (${input.traveler_count} travelers).`,
    is_acknowledged: false,
    created_at: new Date().toISOString(),
  });

  // Log booking activity for customer
  addCustomerActivity(customer.id, {
    type: "booking_created",
    title: `Booked ${tour.title}`,
    description: `Booking reference ${ref} created for ${input.traveler_count} traveler(s). Total: ৳${totalPrice.toLocaleString()}.`,
    metadata: { booking_id: bookingId, reference: ref, tour_id: tour.id, traveler_count: input.traveler_count },
  });

  saveDb(db);
  syncBookingToSupabase(newBooking).catch((err) => console.warn("[Supabase Sync] createBooking error:", err));
  syncCustomerToSupabase(customer).catch((err) => console.warn("[Supabase Sync] createBooking customer error:", err));
  return { booking: newBooking, customer };
}

export function getBookingById(id: string): DbBooking | null {
  const db = loadDb();
  return db.bookings.find((b) => b.id === id) || null;
}

export function updateBooking(id: string, update: Partial<DbBooking>): DbBooking | null {
  const db = loadDb();
  const index = db.bookings.findIndex((b) => b.id === id);
  if (index === -1) return null;

  db.bookings[index] = {
    ...db.bookings[index],
    ...update,
    updated_at: new Date().toISOString(),
  };
  saveDb(db);
  syncBookingToSupabase(db.bookings[index]).catch((err) => console.warn("[Supabase Sync] updateBooking error:", err));
  return db.bookings[index];
}

export function createPayment(input: {
  booking_id: string;
  amount: string;
  payment_type: "advance" | "final" | "full";
  payment_method: "sslcommerz" | "host_cash" | "host_pos" | "customer_self_pay";
}): DbPayment {
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
  saveDb(db);
  return payment;
}

export function getPaymentByTranId(tranId: string): DbPayment | null {
  const db = loadDb();
  return db.payments.find((p) => p.tran_id === tranId) || null;
}

export function confirmPaymentSuccess(tranId: string, valId?: string, cardType?: string): { payment: DbPayment; booking: DbBooking; ticket: DbClearanceTicket } {
  const db = loadDb();
  const paymentIndex = db.payments.findIndex((p) => p.tran_id === tranId);
  if (paymentIndex === -1) {
    throw new Error("Payment transaction not found");
  }

  const payment = db.payments[paymentIndex];
  payment.status = "success";
  payment.val_id = valId || `VAL-${Date.now()}`;
  payment.card_type = cardType || "bKash";
  payment.paid_at = new Date().toISOString();

  const booking = db.bookings.find((b) => b.id === payment.booking_id);
  if (!booking) {
    throw new Error("Associated booking not found");
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
    addCustomerActivity(customer.id, {
      type: "payment_completed",
      title: remainingDue <= 0 ? "Full Payment Confirmed" : "Advance Payment Received",
      description: `Payment of ৳${Math.round(paidAmount).toLocaleString()} received via ${payment.card_type || payment.payment_method} for booking ${booking.reference}.`,
      metadata: { booking_id: booking.id, tran_id: tranId, amount: payment.amount, remaining_due: booking.amount_due },
    });
  }

  saveDb(db);
  syncPaymentToSupabase(payment).catch((err) => console.warn("[Supabase Sync] createPayment error:", err));
  syncBookingToSupabase(booking).catch((err) => console.warn("[Supabase Sync] booking payment sync error:", err));
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
    saveDb(db);
  }
  return ticket;
}


export function clearTicketOnTourDay(
  bookingId: string,
  method: "host_qr_scan" | "customer_self_pay" | "host_cash",
  staffId?: string
): { ticket: DbClearanceTicket; booking: DbBooking } {
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
    addCustomerActivity(customer.id, {
      type: "qr_cleared",
      title: "Tour Clearance Completed",
      description: `Clearance pass verified and balance settled on tour day via ${method.replace(/_/g, " ")}.`,
      metadata: { booking_id: bookingId, clearance_method: method },
    });
  }

  saveDb(db);
  return { ticket, booking };
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

export function createInquiry(input: {
  name: string;
  email: string;
  phone: string;
  destination: string;
  dates: string;
  trip_type: string;
  travelers: number;
  message: string;
}): DbContactInquiry {
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

  saveDb(db);
  return inquiry;
}

// ---------------------------------------------------------------------------
// Admin Management (Tours, Destinations, CMS, Blogs, Offers, Reviews)
// ---------------------------------------------------------------------------

export function getAllToursAdmin(): DbTour[] {
  const db = loadDb();
  return db.tours;
}

export function saveTour(tourData: Partial<DbTour>): DbTour {
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
    hero_image: tourData.hero_image || null,
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
    departure_schedule: tourData.departure_schedule || "Every Friday",
    total_seats: tourData.total_seats || 20,
    departures: tourData.departures && tourData.departures.length > 0 ? tourData.departures : generateInitialDepartures(),
    itinerary: tourData.itinerary || [],
    gallery: tourData.gallery || [],
    faqs: tourData.faqs || [],
    is_featured: Boolean(tourData.is_featured),
    status: tourData.status || "published",
  };

  if (index !== -1) {
    db.tours[index] = { ...db.tours[index], ...defaultTour };
  } else {
    db.tours.unshift(defaultTour);
  }

  saveDb(db);
  syncTourToSupabase(defaultTour).catch((err) => console.warn("[Supabase Sync] saveTour error:", err));
  return defaultTour;
}

export function deleteTour(id: string): boolean {
  const db = loadDb();
  const index = db.tours.findIndex((t) => t.id === id);
  if (index === -1) return false;
  db.tours.splice(index, 1);
  saveDb(db);
  deleteTourFromSupabase(id).catch((err) => console.warn("[Supabase Sync] deleteTour error:", err));
  return true;
}

export function getAllDestinationsAdmin(): DbDestination[] {
  const db = loadDb();
  return db.destinations;
}

export function saveDestination(destData: Partial<DbDestination>): DbDestination {
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
    cover_image: destData.cover_image || null,
    cover_video_url: destData.cover_video_url || "",
    seo_title: destData.seo_title || `${destData.name} Travel Guide | Atithi`,
    seo_description: destData.seo_description || "",
    gallery: destData.gallery || [],
    is_featured: Boolean(destData.is_featured),
    status: destData.status || "published",
  };

  if (index !== -1) {
    db.destinations[index] = { ...db.destinations[index], ...defaultDest };
  } else {
    db.destinations.unshift(defaultDest);
  }

  saveDb(db);
  syncDestinationToSupabase(defaultDest).catch((err) => console.warn("[Supabase Sync] saveDestination error:", err));
  return defaultDest;
}

export function deleteDestination(id: string): boolean {
  const db = loadDb();
  const index = db.destinations.findIndex((d) => d.id === id);
  if (index === -1) return false;
  db.destinations.splice(index, 1);
  saveDb(db);
  deleteDestinationFromSupabase(id).catch((err) => console.warn("[Supabase Sync] deleteDestination error:", err));
  return true;
}

export function getAllBlogPostsAdmin(): DbBlogPost[] {
  const db = loadDb();
  return db.blogPosts;
}

export function saveBlogPost(postData: Partial<DbBlogPost>): DbBlogPost {
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
    cover_image: postData.cover_image || postData.hero_image || null,
    hero_image: postData.hero_image || postData.cover_image || null,
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

  saveDb(db);
  syncBlogPostToSupabase(defaultPost).catch((err) => console.warn("[Supabase Sync] saveBlogPost error:", err));
  return defaultPost;
}

export function deleteBlogPost(id: string): boolean {
  const db = loadDb();
  const index = db.blogPosts.findIndex((p) => p.id === id);
  if (index === -1) return false;
  db.blogPosts.splice(index, 1);
  saveDb(db);
  deleteBlogPostFromSupabase(id).catch((err) => console.warn("[Supabase Sync] deleteBlogPost error:", err));
  return true;
}

export function getAllOffersAdmin(): DbOffer[] {
  const db = loadDb();
  return db.offers;
}

export function saveOffer(offerData: Partial<DbOffer>): DbOffer {
  const db = loadDb();
  const id = offerData.id || `offer-${Date.now()}`;
  const index = db.offers.findIndex((o) => o.id === id);

  const defaultOffer: DbOffer = {
    id,
    title: offerData.title || "Special Offer",
    description: offerData.description || "",
    slug: (offerData.slug || "PROMO").toUpperCase(),
    tour_slug: offerData.tour_slug || null,
    valid_until: offerData.valid_until || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    banner_image: offerData.banner_image || null,
    is_active: offerData.is_active !== false,
  };

  if (index !== -1) {
    db.offers[index] = { ...db.offers[index], ...defaultOffer };
  } else {
    db.offers.unshift(defaultOffer);
  }

  saveDb(db);
  syncOfferToSupabase(defaultOffer).catch((err) => console.warn("[Supabase Sync] saveOffer error:", err));
  return defaultOffer;
}

export function deleteOffer(id: string): boolean {
  const db = loadDb();
  const index = db.offers.findIndex((o) => o.id === id);
  if (index === -1) return false;
  db.offers.splice(index, 1);
  saveDb(db);
  deleteOfferFromSupabase(id).catch((err) => console.warn("[Supabase Sync] deleteOffer error:", err));
  return true;
}

export function getAllTestimonialsAdmin(): DbTestimonial[] {
  const db = loadDb();
  return db.testimonials;
}

export function saveTestimonial(testData: Partial<DbTestimonial>): DbTestimonial {
  const db = loadDb();
  const id = testData.id || `rev-${Date.now()}`;
  const index = db.testimonials.findIndex((t) => t.id === id);

  const defaultTest: DbTestimonial = {
    id,
    customer_name: testData.customer_name || "Valued Guest",
    tour_title: testData.tour_title || "Bangladesh Tour",
    rating: typeof testData.rating === "number" ? testData.rating : 5,
    quote: testData.quote || "",
    customer_photo: testData.customer_photo || null,
    is_featured: testData.is_featured !== false,
  };

  if (index !== -1) {
    db.testimonials[index] = { ...db.testimonials[index], ...defaultTest };
  } else {
    db.testimonials.unshift(defaultTest);
  }

  saveDb(db);
  syncTestimonialToSupabase(defaultTest).catch((err) => console.warn("[Supabase Sync] saveTestimonial error:", err));
  return defaultTest;
}

export function deleteTestimonial(id: string): boolean {
  const db = loadDb();
  const index = db.testimonials.findIndex((t) => t.id === id);
  if (index === -1) return false;
  db.testimonials.splice(index, 1);
  saveDb(db);
  deleteTestimonialFromSupabase(id).catch((err) => console.warn("[Supabase Sync] deleteTestimonial error:", err));
  return true;
}

export function saveHomepageBlock(id: string, blockType: DbHomepageBlock["block_type"], content: Record<string, unknown>): DbHomepageBlock {
  const db = loadDb();
  const index = db.homepageBlocks.findIndex((b) => b.id === id);

  if (index !== -1) {
    db.homepageBlocks[index].content = { ...db.homepageBlocks[index].content, ...content };
    saveDb(db);
    syncHomepageBlockToSupabase(db.homepageBlocks[index]).catch((err) => console.warn("[Supabase Sync] saveHomepageBlock error:", err));
    return db.homepageBlocks[index];
  } else {
    const newBlock: DbHomepageBlock = {
      id,
      block_type: blockType,
      display_order: db.homepageBlocks.length + 1,
      content,
    };
    db.homepageBlocks.push(newBlock);
    saveDb(db);
    syncHomepageBlockToSupabase(newBlock).catch((err) => console.warn("[Supabase Sync] saveHomepageBlock error:", err));
    return newBlock;
  }
}

export function getAllBookingsAdmin(): DbBooking[] {
  const db = loadDb();
  return db.bookings;
}

export function updateBookingStatus(id: string, status: DbBooking["status"]): DbBooking | null {
  const db = loadDb();
  const booking = db.bookings.find((b) => b.id === id);
  if (!booking) return null;
  booking.status = status;
  booking.updated_at = new Date().toISOString();
  saveDb(db);
  syncBookingToSupabase(booking).catch((err) => console.warn("[Supabase Sync] updateBookingStatus error:", err));
  return booking;
}

export function getAllInquiriesAdmin(): DbContactInquiry[] {
  const db = loadDb();
  return db.contactInquiries;
}

export function updateInquiryStatus(
  id: string,
  status: DbContactInquiry["status"],
  adminNotes?: string
): DbContactInquiry | null {
  const db = loadDb();
  const inquiry = db.contactInquiries.find((i) => i.id === id);
  if (!inquiry) return null;
  inquiry.status = status;
  if (adminNotes !== undefined) inquiry.admin_notes = adminNotes;
  saveDb(db);
  return inquiry;
}

