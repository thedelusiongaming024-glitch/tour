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
      code: offer.code || offer.slug || "PROMO",
      tagline: offer.description || null,
      discount_badge: offer.discount_type === "percent" ? `${offer.discount_value}% OFF` : `BDT ${offer.discount_value} OFF`,
      discount_type: offer.discount_type === "percent" ? "percentage" : "flat",
      discount_value: Number(offer.discount_value || 0),
      valid_from: offer.valid_from ? offer.valid_from.slice(0, 10) : new Date().toISOString().slice(0, 10),
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
    const seatsStr =
      Array.isArray(booking.selected_seats) && booking.selected_seats.length > 0
        ? `Seats: ${booking.selected_seats.join(", ")}`
        : null;

    let specialReqs = booking.special_requests || "";
    if (seatsStr && !specialReqs.includes("[Seats:")) {
      specialReqs = specialReqs ? `${specialReqs} [${seatsStr}]` : `[${seatsStr}]`;
    }

    const basePayload = {
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
      pickup_point: seatsStr || b.pickup_point || null,
      special_requests: specialReqs || null,
      total_price: Number(booking.total_price || 0),
      advance_amount: Number(booking.advance_amount || 0),
      amount_paid: Number(booking.amount_paid || 0),
      due_on_tour_day: Number(booking.amount_due || 0),
      status: booking.status || "pending_payment",
      updated_at: new Date().toISOString(),
    };

    const fullPayload = {
      ...basePayload,
      reference: booking.reference || null,
      selected_seats: Array.isArray(booking.selected_seats) ? booking.selected_seats : [],
      travelers: Array.isArray(booking.travelers) ? booking.travelers : [],
    };

    const { error } = await supabase.from("bookings").upsert(fullPayload);
    if (error) {
      // If error is caused by missing column (before SQL migration is run), retry with basePayload
      if (error.code === "PGRST204" || error.message?.includes("column")) {
        const fallbackRes = await supabase.from("bookings").upsert(basePayload);
        if (fallbackRes.error) {
          console.warn("[Supabase Postgres] Booking upsert fallback warning:", fallbackRes.error.message);
          return false;
        }
        return true;
      }
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
    const [destsRes, toursRes, offersRes, testsRes, blogsRes, blocksRes, staffRes, custsRes, bookingsRes, actsRes] = await Promise.all([
      supabase.from("destinations").select("*").order("name"),
      supabase.from("tours").select("*").order("title"),
      supabase.from("offers").select("*"),
      supabase.from("testimonials").select("*"),
      supabase.from("blog_posts").select("*"),
      supabase.from("homepage_blocks").select("*").order("display_order"),
      supabase.from("staff_users").select("*"),
      supabase.from("customers").select("*"),
      supabase.from("bookings").select("*").order("created_at", { ascending: false }),
      supabase.from("customer_activities").select("*").order("created_at", { ascending: false }),
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

    const activitiesByCustomer = new Map<string, DbCustomerActivity[]>();
    for (const act of (actsRes.data || [])) {
      if (!act.customer_id) continue;
      const list = activitiesByCustomer.get(act.customer_id) || [];
      list.push({
        id: act.id,
        customer_id: act.customer_id,
        type: act.type,
        title: act.title,
        description: act.description,
        metadata: typeof act.metadata === "object" && act.metadata !== null ? act.metadata : {},
        created_at: act.created_at || new Date().toISOString(),
      });
      activitiesByCustomer.set(act.customer_id, list);
    }

    const mappedCustomers: DbCustomerUser[] = (custsRes.data || []).map((c: any) => ({
      id: c.id,
      phone_number: c.phone_number,
      full_name: c.full_name,
      email: c.email || undefined,
      created_at: c.created_at || new Date().toISOString(),
      updated_at: c.updated_at || new Date().toISOString(),
      last_login_at: c.last_login_at || undefined,
      activities: activitiesByCustomer.get(c.id) || [],
    }));

    const mappedBookings: DbBooking[] = (bookingsRes.data || []).map((b: any) => {
      let selected_seats: string[] = [];
      if (Array.isArray(b.selected_seats) && b.selected_seats.length > 0) {
        selected_seats = b.selected_seats.map((s: any) => String(s).trim().toUpperCase()).filter(Boolean);
      } else if (typeof b.selected_seats === "string" && b.selected_seats.trim()) {
        try {
          const parsed = JSON.parse(b.selected_seats);
          if (Array.isArray(parsed)) {
            selected_seats = parsed.map((s: any) => String(s).trim().toUpperCase()).filter(Boolean);
          }
        } catch {
          const cleaned = b.selected_seats.replace(/^\{|\}$/g, "");
          selected_seats = cleaned.split(",").map((s: string) => s.trim().toUpperCase()).filter(Boolean);
        }
      } else if (b.pickup_point && typeof b.pickup_point === "string" && b.pickup_point.includes("Seats: ")) {
        const match = b.pickup_point.match(/Seats:\s*([A-Za-z0-9,\s]+)/);
        if (match) {
          selected_seats = match[1].split(",").map((s: string) => s.trim().toUpperCase()).filter(Boolean);
        }
      } else if (b.special_requests && typeof b.special_requests === "string" && b.special_requests.includes("[Seats: ")) {
        const match = b.special_requests.match(/\[Seats:\s*([A-Za-z0-9,\s]+)\]/);
        if (match) {
          selected_seats = match[1].split(",").map((s: string) => s.trim().toUpperCase()).filter(Boolean);
        }
      }

      const travelers = (Array.isArray(b.travelers) && b.travelers.length > 0)
        ? b.travelers
        : (selected_seats.length > 0
          ? selected_seats.map((seat, idx) => ({
              id: `trav-${b.id}-${idx + 1}`,
              full_name: idx === 0 ? b.customer_name : `Traveler ${idx + 1}`,
              seat_number: seat,
              is_lead_traveler: idx === 0,
            }))
          : [{ id: `trav-${b.id}-1`, full_name: b.customer_name, is_lead_traveler: true }]);

      return {
        id: b.id,
        reference: b.reference || (b.id ? `AT-${b.id.slice(-6).toUpperCase()}` : `AT-${Date.now().toString().slice(-6)}`),
        tour_id: b.tour_id,
        tour_title: b.tour_title,
        tour_slug: b.tour_slug,
        destination_slug: b.destination_slug || b.tour_slug || "bangladesh",
        departure_date: b.departure_date,
        traveler_count: Number(b.traveler_count || (selected_seats.length > 0 ? selected_seats.length : 1)),
        selected_seats,
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
        travelers,
        created_at: b.created_at || new Date().toISOString(),
        updated_at: b.updated_at || new Date().toISOString(),
      };
    });

    // Hydrate any rich CMS blocks (e.g. block-home-page, block-about-page, block-journal-page)
    // from the storage snapshot mirror where CMS configurations are safely persisted
    let storageBlocks: DbHomepageBlock[] = [];
    try {
      const { data: storageData, error: storageErr } = await supabase.storage.from(BUCKET_NAME).download(DB_OBJECT_PATH);
      if (!storageErr && storageData) {
        const text = await storageData.text();
        const parsed = JSON.parse(text) as Partial<DatabaseSchema>;
        if (Array.isArray(parsed.homepageBlocks)) {
          storageBlocks = parsed.homepageBlocks;
        }
      }
    } catch {}

    const tableBlocks: DbHomepageBlock[] = blocksRes.data || [];
    const tableBlockIds = new Set(tableBlocks.map((b) => b.id));
    const mergedHomepageBlocks = [...tableBlocks];
    for (const sb of storageBlocks) {
      if (!tableBlockIds.has(sb.id)) {
        mergedHomepageBlocks.push(sb);
      }
    }

    const result: DatabaseSchema = {
      destinations: mappedDestinations,
      tours: mappedTours,
      offers: mappedOffers,
      testimonials: mappedTestimonials,
      blogPosts: mappedBlogs,
      homepageBlocks: mergedHomepageBlocks,
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
      cacheControl: "300",
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
 * Fetch the complete database snapshot directly from Supabase Storage bucket mirror.
 * This reads from CDN/Storage, offloading PostgreSQL entirely for read-heavy operations.
 */
export async function fetchDatabaseFromStorageBucket(): Promise<DatabaseSchema | null> {
  const supabase = getSupabaseAdminClient();
  try {
    const { data, error } = await supabase.storage.from(BUCKET_NAME).download(DB_OBJECT_PATH);
    if (error || !data) {
      return null;
    }
    const text = await data.text();
    const parsed = JSON.parse(text) as DatabaseSchema;
    return parsed;
  } catch (err: any) {
    console.warn("[Supabase Storage Mirror] Exception downloading snapshot:", err?.message || err);
    return null;
  }
}

/**
 * Remotely invoke the Supabase Edge Function 'sync-db-snapshot' to regenerate the bucket mirror,
 * or fallback to local snapshot generation if the edge function is unreachable.
 */
export async function invokeCloudSnapshotSync(): Promise<{
  success: boolean;
  source: "edge-function" | "app-fallback";
  details?: any;
  error?: string;
}> {
  const supabase = getSupabaseAdminClient();
  try {
    const { data, error } = await supabase.functions.invoke("sync-db-snapshot", {
      body: { trigger: "admin_manual_invocation", timestamp: new Date().toISOString() },
    });

    if (!error && data?.success) {
      lastSyncTimestamp = new Date().toISOString();
      lastSyncStatus = "success";
      return { success: true, source: "edge-function", details: data };
    }
  } catch (edgeErr: any) {
    console.warn("[Supabase Edge Function] Direct invocation unavailable, falling back:", edgeErr?.message || edgeErr);
  }

  // Fallback: compile from PostgreSQL via fetchDatabaseFromSupabase and upload to bucket
  try {
    const cloudDb = await fetchDatabaseFromSupabase();
    if (cloudDb) {
      const ok = await syncDatabaseToSupabase(cloudDb);
      return {
        success: ok,
        source: "app-fallback",
        details: { destinations: cloudDb.destinations.length, tours: cloudDb.tours.length },
      };
    }
    return { success: false, source: "app-fallback", error: "Failed to fetch PostgreSQL tables" };
  } catch (err: any) {
    return { success: false, source: "app-fallback", error: err?.message || "Sync failed" };
  }
}

/**
 * Check Supabase connectivity, table availability, and sync status
 */
export async function checkSupabaseHealth(): Promise<{
  connected: boolean;
  projectUrl: string;
  bucket: string;
  bucketMirrorAvailable: boolean;
  lastSync: string | null;
  status: "idle" | "syncing" | "success" | "error";
  error: string | null;
}> {
  const supabase = getSupabaseAdminClient();
  const url = process.env.SUPABASE_URL || "https://tcituxdzdqjgslhctncu.supabase.co";
  try {
    const [tableRes, bucketRes] = await Promise.all([
      supabase.from("destinations").select("id").limit(1),
      supabase.storage.from(BUCKET_NAME).list("", { limit: 1, search: DB_OBJECT_PATH }),
    ]);

    const connected = !tableRes.error && !!tableRes.data;
    const bucketMirrorAvailable = !bucketRes.error && Array.isArray(bucketRes.data) && bucketRes.data.length > 0;

    return {
      connected,
      projectUrl: url,
      bucket: BUCKET_NAME,
      bucketMirrorAvailable,
      lastSync: lastSyncTimestamp,
      status: connected ? "success" : "error",
      error: tableRes.error ? tableRes.error.message : null,
    };
  } catch (err: any) {
    return {
      connected: false,
      projectUrl: url,
      bucket: BUCKET_NAME,
      bucketMirrorAvailable: false,
      lastSync: lastSyncTimestamp,
      status: "error",
      error: err?.message || "Connection failed",
    };
  }
}

