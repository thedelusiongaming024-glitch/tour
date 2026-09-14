import fs from "node:fs";
import path from "node:path";
import { destinations as staticDestinations } from "@/data/destinations";
import { tours as staticTours } from "@/data/tours";
import { journalPosts as staticJournalPosts } from "@/data/journal";
import { specialOffers as staticSpecialOffers, reviews as staticReviews } from "@/data/site";
import { hashPassword } from "./auth";
import { generateClearanceToken } from "./clearance";
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
  const seededDestinations: DbDestination[] = staticDestinations.map((d, index) => ({
    id: slugToId(d.slug),
    name: d.name,
    slug: d.slug,
    division: d.region.replace(" Division", "").toLowerCase(),
    description: d.description,
    best_time_to_visit: d.bestTime,
    weather_notes: d.weather,
    popular_attractions: d.attractions,
    recommended_accommodation: d.accommodation,
    travel_tips: d.travelTips.join("\n"),
    permits_required: d.slug === "sajek" || d.slug === "bandarban" ? "Local security clearance at checkpost" : "None",
    cover_image: d.cover.imageUrl || null,
    cover_video_url: d.cover.videoUrl || "",
    seo_title: `${d.name} Travel Guide | Atithi`,
    seo_description: d.tagline,
    gallery: d.gallery.map((g, i) => ({
      id: `gal-${d.slug}-${i}`,
      image: g.imageUrl || "",
      caption: g.label,
    })),
    is_featured: index < 6,
    status: "published",
  }));

  const seededTours: DbTour[] = staticTours.map((t, index) => {
    const finalPrice = Math.max(0, t.startingPrice - t.discount);
    const advancePercent = t.advancePercent || 40;
    const advanceAmount = Math.round((finalPrice * advancePercent) / 100);

    const matchDest = staticDestinations.find((d) => d.slug === t.destinationSlug);

    // Parse duration string e.g. "3 Days / 2 Nights"
    let days = 3;
    let nights = 2;
    const matchDuration = t.duration.match(/(\d+)\s*Day/i);
    const matchNight = t.duration.match(/(\d+)\s*Night/i);
    if (matchDuration) days = parseInt(matchDuration[1], 10);
    if (matchNight) nights = parseInt(matchNight[1], 10);

    return {
      id: slugToId(t.slug),
      title: t.title,
      slug: t.slug,
      destination_slug: t.destinationSlug,
      destination_name: matchDest?.name || t.destinationSlug,
      category: t.category.toLowerCase().replace(/\s+/g, "_"),
      short_description: t.summary,
      full_description: t.description,
      hero_image: t.cover.imageUrl || null,
      duration_days: days,
      duration_nights: nights,
      base_price: t.startingPrice.toFixed(2),
      discount_type: t.discount > 0 ? "flat" : "none",
      discount_value: t.discount.toFixed(2),
      final_price: finalPrice.toFixed(2),
      allow_partial_payment: t.allowPartialPayment !== false,
      advance_payment_percent: advancePercent.toString(),
      advance_amount: advanceAmount.toFixed(2),
      inclusions: t.inclusions,
      exclusions: t.exclusions,
      accommodation_notes: t.accommodation,
      transportation_notes: t.transportation,
      meals_notes: t.meals,
      meeting_point: t.meetingPoint,
      departure_schedule: t.departure,
      total_seats: t.capacity || 20,
      departures: generateInitialDepartures(),
      itinerary: t.itinerary.map((item) => ({
        day_number: item.day,
        title: item.title,
        description: item.description,
      })),
      gallery: t.gallery.map((g, i) => ({
        id: `tgal-${t.slug}-${i}`,
        image: g.imageUrl || "",
        caption: g.label,
      })),
      faqs: t.faqs,
      is_featured: index < 4 || Boolean(t.featured),
      status: "published",
    };
  });

  const seededOffers: DbOffer[] = staticSpecialOffers.map((o, index) => ({
    id: `offer-${index + 1}`,
    title: o.title,
    description: o.description,
    slug: o.code.toLowerCase(),
    tour_slug: null,
    valid_until: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    banner_image: o.bannerUrl || null,
    is_active: true,
  }));

  const seededReviews: DbTestimonial[] = staticReviews.map((r, index) => ({
    id: `rev-${index + 1}`,
    customer_name: r.name,
    tour_title: r.tour,
    rating: r.rating,
    quote: r.text,
    customer_photo: r.photoUrl || null,
    is_featured: true,
  }));

  const seededBlogPosts: DbBlogPost[] = staticJournalPosts.map((p, index) => ({
    id: slugToId(p.slug),
    slug: p.slug,
    title: p.title,
    category: { name: p.category },
    author_name: p.author,
    cover_image: p.cover.imageUrl || null,
    excerpt: p.excerpt,
    body: p.body.map((b) => (b.heading ? `### ${b.heading}\n\n` : "") + b.paragraphs.join("\n\n")).join("\n\n"),
    published_at: new Date(Date.now() - index * 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: "published",
  }));

  const seededHomepageBlocks: DbHomepageBlock[] = [
    {
      id: "block-hero-1",
      block_type: "hero",
      display_order: 1,
      content: {
        eyebrow: "Premium domestic tours across Bangladesh",
        headline: "Discover Bangladesh,",
        highlight: "your way",
        subheadline:
          "Curated domestic tours. Trusted local hosts. Book with a small advance and clear the balance on tour day — with confirmation to both sides, every time.",
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

  const seededExpenses: DbExpense[] = [
    {
      id: "exp-1",
      category: "hotel",
      amount: "45000.00",
      date: new Date().toISOString().split("T")[0],
      description: "Sajek Valley Resort group booking accommodation",
    },
    {
      id: "exp-2",
      category: "transport",
      amount: "32000.00",
      date: new Date().toISOString().split("T")[0],
      description: "AC Coaster transport fuel & driver fees Dhaka-Sajek",
    },
    {
      id: "exp-3",
      category: "operations",
      amount: "18500.00",
      date: new Date().toISOString().split("T")[0],
      description: "Guide honorarium, food catering, toll clearances",
    },
  ];

  const seededSuppliers: DbSupplier[] = [
    { id: "sup-1", name: "Meghpunji Resort Sajek", outstanding_balance: "22000.00", is_active: true },
    { id: "sup-2", name: "Green Line Paribahan", outstanding_balance: "15000.00", is_active: true },
    { id: "sup-3", name: "Kolatoli Beachside Suites", outstanding_balance: "18000.00", is_active: true },
  ];

  const seededAlerts: DbAlert[] = [
    {
      id: "alt-1",
      alert_type: "departure_filling",
      severity: "info",
      message: "Sajek Valley Friday departure is 80% booked (4 seats remaining).",
      is_acknowledged: false,
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: "alt-2",
      alert_type: "weather_advisory",
      severity: "warning",
      message: "Heavy rain forecasted in Sylhet; coordinate with local boatmen at Ratargul.",
      is_acknowledged: false,
      created_at: new Date(Date.now() - 7200000).toISOString(),
    },
  ];

  return {
    destinations: seededDestinations,
    tours: seededTours,
    offers: seededOffers,
    testimonials: seededReviews,
    blogPosts: seededBlogPosts,
    homepageBlocks: seededHomepageBlocks,
    staffUsers: seededStaff,
    bookings: [],
    payments: [],
    clearanceTickets: [],
    alerts: seededAlerts,
    expenses: seededExpenses,
    suppliers: seededSuppliers,
    contactInquiries: [],
  };
}

function loadDb(): DatabaseSchema {
  if (memoryDb) return memoryDb;

  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      memoryDb = JSON.parse(raw) as DatabaseSchema;
      return memoryDb;
    }
  } catch (err) {
    console.error("Failed to read database file, initializing from seed:", err);
  }

  memoryDb = createSeedData();
  saveDb(memoryDb);
  return memoryDb;
}

function saveDb(data: DatabaseSchema) {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to persist database file to disk:", err);
  }
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
