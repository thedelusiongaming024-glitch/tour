import { getSupabaseAdminClient } from "@/lib/supabase";
import type {
  DatabaseSchema,
  DbBlogPost,
  DbBooking,
  DbCustomerActivity,
  DbCustomerUser,
  DbDestination,
  DbHomepageBlock,
  DbOffer,
  DbPayment,
  DbTestimonial,
  DbTour,
} from "./types";

const BUCKET_NAME = "atithi-data";
const DB_OBJECT_PATH = "db.json";

let lastSyncTimestamp: string | null = null;
let lastSyncStatus: "idle" | "syncing" | "success" | "error" = "idle";
let lastSyncError: string | null = null;

// =============================================================================
// PostgreSQL Direct Entity Sync
// =============================================================================

export async function syncDestinationToSupabase(dest: DbDestination): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  try {
    const payload = {
      id: dest.id,
      name: dest.name,
      slug: dest.slug,
      division: dest.division,
      tagline: dest.tagline || null,
      description: dest.description || null,
      best_time_to_visit: dest.best_time_to_visit || null,
      weather_notes: dest.weather_notes || null,
      popular_attractions: dest.popular_attractions || [],
      recommended_accommodation: dest.recommended_accommodation || null,
      travel_tips: dest.travel_tips || null,
      permits_required: dest.permits_required || null,
      cover_image: dest.cover_image || null,
      cover_video_url: dest.cover_video_url || null,
      seo_title: dest.seo_title || null,
      seo_description: dest.seo_description || null,
      gallery: dest.gallery || [],
      is_featured: Boolean(dest.is_featured),
      status: dest.status || "published",
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("destinations").upsert(payload);
    if (error) {
      console.warn("[Supabase Postgres] Destination upsert warning:", error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn("[Supabase Postgres] Destination upsert exception:", err?.message || err);
    return false;
  }
}

export async function deleteDestinationFromSupabase(id: string): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  try {
    const { error } = await supabase.from("destinations").delete().eq("id", id);
    if (error) {
      console.warn("[Supabase Postgres] Destination delete warning:", error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn("[Supabase Postgres] Destination delete exception:", err?.message || err);
    return false;
  }
}

export async function syncTourToSupabase(tour: DbTour): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  try {
    const payload = {
      id: tour.id,
      title: tour.title,
      slug: tour.slug,
      destination_slug: tour.destination_slug,
      category: tour.category || "package_tour",
      duration_days: Number(tour.duration_days || 1),
      duration_nights: Number(tour.duration_nights || 0),
      starting_price: Number(tour.base_price || 0),
      discount: Number(tour.discount_value || 0),
      advance_percent: Number(tour.advance_payment_percent || 40),
      advance_amount: Number(tour.advance_amount || 0),
      hero_image: tour.hero_image || null,
      overview: tour.full_description || tour.short_description || "",
      itinerary: tour.itinerary || [],
      inclusions: tour.inclusions || [],
      exclusions: tour.exclusions || [],
      departures: tour.departures || [],
      faqs: tour.faqs || [],
      status: tour.status || "published",
      is_featured: Boolean(tour.is_featured),
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("tours").upsert(payload);
    if (error) {
      console.warn("[Supabase Postgres] Tour upsert warning:", error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn("[Supabase Postgres] Tour upsert exception:", err?.message || err);
    return false;
  }
}

export async function deleteTourFromSupabase(id: string): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  try {
    const { error } = await supabase.from("tours").delete().eq("id", id);
    if (error) {
      console.warn("[Supabase Postgres] Tour delete warning:", error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn("[Supabase Postgres] Tour delete exception:", err?.message || err);
    return false;
  }
}

export async function syncOfferToSupabase(offer: DbOffer): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  try {
    const payload = {
      id: offer.id,
      title: offer.title,
      code: offer.code,
      tagline: offer.description || null,
      discount_badge: offer.discount_type === "percent" ? `${offer.discount_value}% OFF` : `BDT ${offer.discount_value} OFF`,
      discount_type: offer.discount_type === "percent" ? "percentage" : "flat",
      discount_value: Number(offer.discount_value || 0),
      valid_from: offer.valid_from ? offer.valid_from.slice(0, 10) : null,
      valid_until: offer.valid_until ? offer.valid_until.slice(0, 10) : null,
      minimum_spend: Number(offer.minimum_spend || 0),
      image_url: offer.banner_image || null,
    };
    const { error } = await supabase.from("offers").upsert(payload);
    if (error) {
      console.warn("[Supabase Postgres] Offer upsert warning:", error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn("[Supabase Postgres] Offer upsert exception:", err?.message || err);
    return false;
  }
}

export async function deleteOfferFromSupabase(id: string): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  try {
    const { error } = await supabase.from("offers").delete().eq("id", id);
    if (error) return false;
    return true;
  } catch {
    return false;
  }
}

export async function syncTestimonialToSupabase(test: DbTestimonial): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  try {
    const payload = {
      id: test.id,
      author_name: test.author_name || test.customer_name,
      trip_name: test.trip_name || test.tour_title,
      author_location: test.author_location || "Bangladesh",
      author_avatar: test.author_avatar || test.customer_photo || null,
      rating: Number(test.rating || 5),
      quote: test.quote,
      is_featured: Boolean(test.is_featured),
    };
    const { error } = await supabase.from("testimonials").upsert(payload);
    if (error) {
      console.warn("[Supabase Postgres] Testimonial upsert warning:", error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn("[Supabase Postgres] Testimonial upsert exception:", err?.message || err);
    return false;
  }
}

export async function deleteTestimonialFromSupabase(id: string): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  try {
    const { error } = await supabase.from("testimonials").delete().eq("id", id);
    if (error) return false;
    return true;
  } catch {
    return false;
  }
}

export async function syncBlogPostToSupabase(post: DbBlogPost): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  try {
    const payload = {
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || null,
      content: post.body || post.content || null,
      author: post.author_name || post.author || "Atithi Editorial",
      hero_image: post.cover_image || post.hero_image || null,
      read_time_minutes: Number(post.read_time_minutes || 5),
      tags: post.tags || [],
      is_published: post.status === "published" || post.is_published !== false,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("blog_posts").upsert(payload);
    if (error) {
      console.warn("[Supabase Postgres] Blog post upsert warning:", error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn("[Supabase Postgres] Blog post upsert exception:", err?.message || err);
    return false;
  }
}

export async function deleteBlogPostFromSupabase(id: string): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  try {
    const { error } = await supabase.from("blog_posts").delete().eq("id", id);
    if (error) return false;
    return true;
  } catch {
    return false;
  }
}

export async function syncHomepageBlockToSupabase(block: DbHomepageBlock): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  try {
    const payload = {
      id: block.id,
      block_type: block.block_type,
      display_order: Number(block.display_order || 0),
      content: block.content || {},
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("homepage_blocks").upsert(payload);
    if (error) return false;
    return true;
  } catch {
    return false;
  }
}

export async function syncCustomerToSupabase(customer: DbCustomerUser): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  try {
    const payload = {
      id: customer.id,
      phone_number: customer.phone_number,
      full_name: customer.full_name,
      email: customer.email || null,
      created_at: customer.created_at || new Date().toISOString(),
      updated_at: customer.updated_at || new Date().toISOString(),
      last_login_at: customer.last_login_at || null,
    };
    const { error } = await supabase.from("customers").upsert(payload);
    if (error) {
      console.warn("[Supabase Postgres] Customer upsert warning:", error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn("[Supabase Postgres] Customer upsert exception:", err?.message || err);
    return false;
  }
}

export async function syncCustomerActivityToSupabase(activity: DbCustomerActivity): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  try {
    const payload = {
      id: activity.id,
      customer_id: activity.customer_id,
      type: activity.type,
      title: activity.title,
      description: activity.description,
      metadata: activity.metadata || {},
      created_at: activity.created_at || new Date().toISOString(),
    };
    const { error } = await supabase.from("customer_activities").upsert(payload);
    if (error) {
      console.warn("[Supabase Postgres] Customer activity upsert warning:", error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn("[Supabase Postgres] Customer activity upsert exception:", err?.message || err);
    return false;
  }
}

export async function syncBookingToSupabase(booking: DbBooking): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  try {
    const b = booking as any;
    const payload = {
      id: booking.id,
      tour_id: booking.tour_id,
      tour_title: booking.tour_title,
      tour_slug: booking.tour_slug,
      departure_date: booking.departure_date ? booking.departure_date.slice(0, 10) : new Date().toISOString().slice(0, 10),
      traveler_count: Number(booking.traveler_count || 1),
      customer_name: booking.customer_full_name,
      customer_email: booking.customer_email || "guest@example.com",
      customer_phone: booking.customer_phone_number || "+8801700000000",
      customer_id: b.customer_id || null,
      pickup_point: b.pickup_point || null,
      special_requests: booking.special_requests || null,
      total_price: Number(booking.total_price || 0),
      advance_amount: Number(booking.advance_amount || 0),
      amount_paid: Number(booking.amount_paid || 0),
      due_on_tour_day: Number(booking.amount_due || 0),
      status: booking.status || "pending_payment",
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("bookings").upsert(payload);
    if (error) {
      console.warn("[Supabase Postgres] Booking upsert warning:", error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn("[Supabase Postgres] Booking upsert exception:", err?.message || err);
    return false;
  }
}

export async function syncPaymentToSupabase(payment: DbPayment): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  try {
    const p = payment as any;
    const payload = {
      id: payment.id,
      booking_id: payment.booking_id,
      transaction_id: payment.tran_id,
      payment_method: payment.payment_method,
      payment_type: payment.payment_type,
      amount: Number(payment.amount),
      status: payment.status,
      raw_payload: p.val_id ? { val_id: p.val_id } : null,
    };
    const { error } = await supabase.from("payments").upsert(payload);
    if (error) return false;
    return true;
  } catch {
    return false;
  }
}

// =============================================================================
// Full PostgreSQL Hydration from Supabase
// =============================================================================

export async function fetchDatabaseFromSupabase(): Promise<DatabaseSchema | null> {
  const supabase = getSupabaseAdminClient();
  try {
    const [destsRes, toursRes, offersRes, testsRes, blogsRes, blocksRes, staffRes, custsRes, bookingsRes] = await Promise.all([
      supabase.from("destinations").select("*").order("name"),
      supabase.from("tours").select("*").order("title"),
      supabase.from("offers").select("*"),
      supabase.from("testimonials").select("*"),
      supabase.from("blog_posts").select("*"),
      supabase.from("homepage_blocks").select("*").order("display_order"),
      supabase.from("staff_users").select("*"),
      supabase.from("customers").select("*"),
      supabase.from("bookings").select("*").order("created_at", { ascending: false }),
    ]);

    if (destsRes.error && toursRes.error) {
      // Fallback to storage bucket snapshot if tables are inaccessible
      const { data, error } = await supabase.storage.from(BUCKET_NAME).download(DB_OBJECT_PATH);
      if (error || !data) return null;
      const text = await data.text();
      return JSON.parse(text) as DatabaseSchema;
    }

    const mappedDestinations: DbDestination[] = (destsRes.data || []).map((d: any) => ({
      id: d.id,
      name: d.name,
      slug: d.slug,
      division: d.division,
      tagline: d.tagline || "",
      description: d.description || "",
      best_time_to_visit: d.best_time_to_visit || "October to March",
      weather_notes: d.weather_notes || "",
      popular_attractions: Array.isArray(d.popular_attractions) ? d.popular_attractions : [],
      recommended_accommodation: d.recommended_accommodation || "",
      travel_tips: d.travel_tips || "",
      permits_required: d.permits_required || "None",
      cover_image: d.cover_image,
      cover_video_url: d.cover_video_url,
      seo_title: d.seo_title,
      seo_description: d.seo_description,
      gallery: Array.isArray(d.gallery) ? d.gallery : [],
      is_featured: Boolean(d.is_featured),
      status: d.status || "published",
    }));

    const mappedTours: DbTour[] = (toursRes.data || []).map((t: any) => ({
      id: t.id,
      title: t.title,
      slug: t.slug,
      destination_slug: t.destination_slug,
      destination_name: t.destination_slug ? t.destination_slug.charAt(0).toUpperCase() + t.destination_slug.slice(1) : "Bangladesh",
      category: t.category,
      short_description: t.overview || "",
      full_description: t.overview || "",
      hero_image: t.hero_image,
      duration_days: Number(t.duration_days || 1),
      duration_nights: Number(t.duration_nights || 0),
      base_price: String(t.starting_price || 0),
      discount_type: Number(t.discount) > 0 ? "flat" : "none",
      discount_value: String(t.discount || 0),
      final_price: String(Math.max(0, Number(t.starting_price || 0) - Number(t.discount || 0))),
      allow_partial_payment: true,
      advance_payment_percent: String(t.advance_percent || 40),
      advance_amount: String(t.advance_amount || Math.round((Number(t.starting_price || 0) * 40) / 100)),
      inclusions: Array.isArray(t.inclusions) ? t.inclusions : [],
      exclusions: Array.isArray(t.exclusions) ? t.exclusions : [],
      accommodation_notes: "Standard hotel / resort",
      transportation_notes: "AC Bus / Private Jeep",
      meals_notes: "Breakfast included",
      meeting_point: "Dhaka Sayedabad / Fakirapool",
      departure_schedule: "Every Friday 7:00 AM",
      total_seats: 14,
      itinerary: Array.isArray(t.itinerary) ? t.itinerary : [],
      departures: Array.isArray(t.departures) ? t.departures : [],
      faqs: Array.isArray(t.faqs) ? t.faqs : [],
      gallery: [],
      is_featured: Boolean(t.is_featured),
      status: t.status || "published",
    }));

    const mappedOffers: DbOffer[] = (offersRes.data || []).map((o: any) => ({
      id: o.id,
      title: o.title,
      code: o.code || "PROMO",
      slug: (o.code || o.title).toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      description: o.tagline || "",
      discount_type: o.discount_type === "percentage" ? "percent" : "flat",
      discount_value: String(o.discount_value || 0),
      minimum_spend: String(o.minimum_spend || 0),
      valid_from: o.valid_from || new Date().toISOString().slice(0, 10),
      valid_until: o.valid_until || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      banner_image: o.image_url || null,
      tour_slug: o.tour_slug || null,
      is_active: true,
    }));

    const mappedTestimonials: DbTestimonial[] = (testsRes.data || []).map((t: any) => ({
      id: t.id,
      author_name: t.author_name,
      customer_name: t.author_name,
      trip_name: t.trip_name,
      tour_title: t.trip_name,
      author_location: t.author_location || "Bangladesh",
      rating: Number(t.rating || 5),
      quote: t.quote,
      author_avatar: t.author_avatar || null,
      customer_photo: t.author_avatar || null,
      is_featured: Boolean(t.is_featured),
    }));

    const mappedBlogs: DbBlogPost[] = (blogsRes.data || []).map((b: any) => ({
      id: b.id,
      title: b.title,
      slug: b.slug,
      excerpt: b.excerpt || "",
      body: b.content || "",
      content: b.content || "",
      author_name: b.author || "Atithi Editorial",
      author: b.author || "Atithi Editorial",
      cover_image: b.hero_image || null,
      hero_image: b.hero_image || null,
      read_time_minutes: Number(b.read_time_minutes || 5),
      tags: Array.isArray(b.tags) ? b.tags : [],
      published_at: b.created_at || new Date().toISOString(),
      created_at: b.created_at,
      status: b.is_published ? "published" : "draft",
      is_published: Boolean(b.is_published),
      category: { name: "Travel Guide" },
    }));

    // Ensure super_admin password hash is valid
    const adminSalt = "8e4c1ce665ceb8419ff57a1aefb13252";
    const adminHash = "8e5067117177fb5bc6056d3d76ea336f31779c1d21e6aa416cc7b1b0a8e0b4eb7a67a80908c62751951736809a3d2f81f7762e9e6fc203d7715fe126786193d2";
    const mappedStaff = (staffRes.data && staffRes.data.length > 0)
      ? staffRes.data.map((s: any) => ({
          id: s.id,
          username: s.username,
          password_hash: s.password_hash === "REPLACE_WITH_REAL_HASH" ? adminHash : s.password_hash,
          salt: s.salt === "REPLACE_WITH_REAL_SALT" ? adminSalt : s.salt,
          role: s.role === "admin" ? "super_admin" : (s.role || "super_admin"),
          phone_number: s.phone_number || "+8801929582426",
          email: s.email || "savartourlover@gmail.com",
          first_name: s.first_name || "Savar",
          last_name: s.last_name || "Admin",
        }))
      : [
          {
            id: "staff_admin_01",
            username: "admin",
            password_hash: adminHash,
            salt: adminSalt,
            role: "super_admin" as const,
            phone_number: "+8801929582426",
            email: "savartourlover@gmail.com",
            first_name: "Savar",
            last_name: "Admin",
          },
        ];

    const mappedCustomers: DbCustomerUser[] = (custsRes.data || []).map((c: any) => ({
      id: c.id,
      phone_number: c.phone_number,
      full_name: c.full_name,
      email: c.email || undefined,
      created_at: c.created_at || new Date().toISOString(),
      updated_at: c.updated_at || new Date().toISOString(),
      last_login_at: c.last_login_at || undefined,
      activities: [],
    }));

    const mappedBookings: DbBooking[] = (bookingsRes.data || []).map((b: any) => ({
      id: b.id,
      reference: b.reference || `AT-${b.id.slice(-6)}`,
      tour_id: b.tour_id,
      tour_title: b.tour_title,
      tour_slug: b.tour_slug,
      destination_slug: b.destination_slug || b.tour_slug || "bangladesh",
      departure_date: b.departure_date,
      traveler_count: Number(b.traveler_count || 1),
      unit_price: String(b.unit_price || Math.round(Number(b.total_price || 0) / Math.max(1, Number(b.traveler_count || 1)))),
      total_price: String(b.total_price || 0),
      final_price: String(b.total_price || 0),
      payment_plan: Number(b.due_on_tour_day || 0) > 0 ? "partial" : "full",
      advance_required_percent: "40",
      advance_amount: String(b.advance_amount || 0),
      amount_paid: String(b.amount_paid || 0),
      amount_due: String(b.due_on_tour_day || 0),
      due_date: b.departure_date || new Date().toISOString().slice(0, 10),
      status: b.status || "pending_payment",
      customer_id: b.customer_id || undefined,
      customer_full_name: b.customer_name,
      customer_phone_number: b.customer_phone,
      customer_email: b.customer_email || "",
      special_requests: b.special_requests || "",
      travelers: [{ id: `trav-${b.id}-1`, full_name: b.customer_name, is_lead_traveler: true }],
      created_at: b.created_at || new Date().toISOString(),
      updated_at: b.updated_at || new Date().toISOString(),
    }));

    const result: DatabaseSchema = {
      destinations: mappedDestinations,
      tours: mappedTours,
      offers: mappedOffers,
      testimonials: mappedTestimonials,
      blogPosts: mappedBlogs,
      homepageBlocks: blocksRes.data || [],
      staffUsers: mappedStaff,
      customers: mappedCustomers,
      bookings: mappedBookings,
      payments: [],
      clearanceTickets: [],
      alerts: [],
      expenses: [],
      suppliers: [],
      contactInquiries: [],
    };

    lastSyncTimestamp = new Date().toISOString();
    lastSyncStatus = "success";
    lastSyncError = null;
    return result;
  } catch (err: any) {
    console.warn("[Supabase Sync] Exception fetching database:", err?.message || err);
    return null;
  }
}

/**
 * Backup the in-memory/local JSON database snapshot up to Supabase Cloud Storage
 */
export async function syncDatabaseToSupabase(data: DatabaseSchema): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  lastSyncStatus = "syncing";
  try {
    const raw = JSON.stringify(data, null, 2);
    const { error } = await supabase.storage.from(BUCKET_NAME).upload(DB_OBJECT_PATH, raw, {
      contentType: "application/json",
      upsert: true,
    });
    if (error) {
      console.error("[Supabase Storage] Upload error:", error.message);
      lastSyncStatus = "error";
      lastSyncError = error.message;
      return false;
    }
    lastSyncTimestamp = new Date().toISOString();
    lastSyncStatus = "success";
    lastSyncError = null;
    return true;
  } catch (err: any) {
    console.error("[Supabase Storage] Exception during cloud sync:", err?.message || err);
    lastSyncStatus = "error";
    lastSyncError = err?.message || "Sync exception";
    return false;
  }
}

/**
 * Check Supabase connectivity, table availability, and sync status
 */
export async function checkSupabaseHealth(): Promise<{
  connected: boolean;
  projectUrl: string;
  bucket: string;
  lastSync: string | null;
  status: "idle" | "syncing" | "success" | "error";
  error: string | null;
}> {
  const supabase = getSupabaseAdminClient();
  const url = process.env.SUPABASE_URL || "https://tcituxdzdqjgslhctncu.supabase.co";
  try {
    const { data, error } = await supabase.from("destinations").select("id").limit(1);
    const connected = !error && !!data;
    return {
      connected,
      projectUrl: url,
      bucket: BUCKET_NAME,
      lastSync: lastSyncTimestamp,
      status: connected ? "success" : "error",
      error: error ? error.message : null,
    };
  } catch (err: any) {
    return {
      connected: false,
      projectUrl: url,
      bucket: BUCKET_NAME,
      lastSync: lastSyncTimestamp,
      status: "error",
      error: err?.message || "Connection failed",
    };
  }
}
