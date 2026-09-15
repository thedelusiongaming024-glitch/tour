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
  syncPaymentToSupabase,
  fetchDatabaseFromSupabase,
} from "./supabase";
import type {
  DatabaseSchema,
  DbAlert,
  DbBlogPost,
  DbBooking,
  DbClearanceTicket,
  DbContactInquiry,
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
      lastDbMtime = stat.mtimeMs;
      return memoryDb;
    }
  } catch (err) {
    console.error("Failed to read database file, initializing from seed:", err);
  }

  if (memoryDb) return memoryDb;
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
  return db.blogPosts.filter((p) => p.status === "published");
}

export function getBlogPostBySlug(slug: string): DbBlogPost | null {
  const db = loadDb();
  return db.blogPosts.find((p) => p.slug === slug) || null;
}

export function getHomepageBlocks(): DbHomepageBlock[] {
  const db = loadDb();
  return [...db.homepageBlocks].sort((a, b) => a.display_order - b.display_order);
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
}): DbBooking {
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
    customer_full_name: input.customer_full_name,
    customer_phone_number: input.customer_phone_number,
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

  // Auto-alert
  db.alerts.unshift({
    id: `alt-book-${Date.now()}`,
    alert_type: "new_booking",
    severity: "info",
    message: `New booking ${ref} created for ${tour.title} (${input.traveler_count} travelers).`,
    is_acknowledged: false,
    created_at: new Date().toISOString(),
  });

  saveDb(db);
  syncBookingToSupabase(newBooking).catch((err) => console.warn("[Supabase Sync] createBooking error:", err));
  return newBooking;
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
  return db.clearanceTickets.find((t) => t.booking_id === bookingId) || null;
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

  const defaultPost: DbBlogPost = {
    id,
    title: postData.title || "Untitled Post",
    slug: postData.slug || `post-${Date.now()}`,
    category: postData.category || { name: "Travel Tips" },
    author_name: postData.author_name || "Atithi Editorial",
    cover_image: postData.cover_image || null,
    excerpt: postData.excerpt || "",
    body: postData.body || "",
    published_at: postData.published_at || new Date().toISOString(),
    status: postData.status || "published",
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

