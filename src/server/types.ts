export interface DbDestination {
  id: string;
  name: string;
  slug: string;
  division: string;
  description: string;
  best_time_to_visit: string;
  weather_notes: string;
  popular_attractions: string[];
  recommended_accommodation: string;
  travel_tips: string;
  permits_required: string;
  cover_image: string | null;
  cover_video_url: string;
  seo_title: string;
  seo_description: string;
  gallery: { id: string; image: string; caption: string }[];
  is_featured: boolean;
  status: "published" | "draft" | "archived";
}

export interface DbDeparture {
  id: string;
  departure_date: string;
  seats_remaining: number;
  is_active: boolean;
}

export interface DbTour {
  id: string;
  title: string;
  slug: string;
  destination_slug: string;
  destination_name: string;
  category: string;
  short_description: string;
  full_description: string;
  hero_image: string | null;
  duration_days: number;
  duration_nights: number;
  base_price: string;
  discount_type: "flat" | "percent" | "none";
  discount_value: string;
  final_price: string;
  allow_partial_payment: boolean;
  advance_payment_percent: string;
  advance_amount: string;
  inclusions: string[];
  exclusions: string[];
  accommodation_notes: string;
  transportation_notes: string;
  meals_notes: string;
  meeting_point: string;
  departure_schedule: string;
  total_seats: number;
  departures: DbDeparture[];
  itinerary: { day_number: number; title: string; description: string }[];
  gallery: { id: string; image: string; caption: string }[];
  faqs: { question: string; answer: string }[];
  is_featured: boolean;
  status: "published" | "draft" | "archived";
}

export interface DbOffer {
  id: string;
  title: string;
  description: string;
  slug: string;
  tour_slug: string | null;
  valid_until: string;
  banner_image: string | null;
  is_active: boolean;
}

export interface DbTestimonial {
  id: string;
  customer_name: string;
  tour_title: string;
  rating: number;
  quote: string;
  customer_photo: string | null;
  is_featured: boolean;
}

export interface DbBlogPost {
  id: string;
  slug: string;
  title: string;
  category: { name: string } | null;
  author_name: string;
  cover_image: string | null;
  excerpt: string;
  body: string;
  published_at: string;
  status: "published" | "draft";
}

export interface DbHomepageBlock {
  id: string;
  block_type:
    | "hero"
    | "rich_text"
    | "image"
    | "featured_tours"
    | "destination_grid"
    | "testimonials"
    | "cta"
    | "gallery";
  display_order: number;
  content: Record<string, unknown>;
}

export type StaffRole = "super_admin" | "finance_manager" | "operations_staff" | "sales_manager" | "tour_host";

export interface DbStaffUser {
  id: string;
  username: string;
  password_hash: string;
  salt: string;
  role: StaffRole;
  phone_number: string | null;
  email: string | null;
  first_name: string;
  last_name: string;
}

export type BookingStatus =
  | "pending_payment"
  | "confirmed_advance_paid"
  | "confirmed_fully_paid"
  | "cleared_on_tour_day"
  | "cancelled"
  | "refunded";

export interface DbTraveler {
  id: string;
  full_name: string;
  age?: number;
  nid_or_birth_cert?: string;
  is_lead_traveler: boolean;
}

export interface DbBooking {
  id: string;
  reference: string;
  tour_id: string;
  tour_title: string;
  tour_slug: string;
  destination_slug: string;
  departure_id?: string;
  departure_date?: string;
  traveler_count: number;
  unit_price: string;
  total_price: string;
  final_price: string;
  payment_plan: "full" | "partial";
  advance_required_percent: string;
  advance_amount: string;
  amount_paid: string;
  amount_due: string;
  due_date: string;
  status: BookingStatus;
  customer_full_name: string;
  customer_phone_number: string;
  customer_email: string;
  special_requests?: string;
  travelers: DbTraveler[];
  created_at: string;
  updated_at: string;
}

export interface DbPayment {
  id: string;
  booking_id: string;
  amount: string;
  payment_type: "advance" | "final" | "full";
  payment_method: "sslcommerz" | "host_cash" | "host_pos" | "customer_self_pay";
  status: "pending" | "success" | "failed" | "cancelled";
  tran_id: string;
  gateway_session_key?: string;
  val_id?: string;
  card_type?: string;
  created_at: string;
  paid_at?: string;
}

export interface DbClearanceTicket {
  id: string;
  booking_id: string;
  token: string;
  token_expires_at: string;
  is_cleared: boolean;
  cleared_at?: string;
  cleared_by_staff_id?: string;
  clearance_method?: "host_qr_scan" | "customer_self_pay" | "host_cash" | "verification_only";
  created_at: string;
}

export interface DbAlert {
  id: string;
  alert_type: string;
  severity: "info" | "warning" | "critical";
  message: string;
  is_acknowledged: boolean;
  created_at: string;
}

export interface DbExpense {
  id: string;
  category: string;
  amount: string;
  date: string;
  description: string;
}

export interface DbSupplier {
  id: string;
  name: string;
  outstanding_balance: string;
  is_active: boolean;
}

export interface DbContactInquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  destination: string;
  dates: string;
  trip_type: string;
  travelers: number;
  message: string;
  status: "new" | "in_progress" | "resolved";
  created_at: string;
}

export interface DatabaseSchema {
  destinations: DbDestination[];
  tours: DbTour[];
  offers: DbOffer[];
  testimonials: DbTestimonial[];
  blogPosts: DbBlogPost[];
  homepageBlocks: DbHomepageBlock[];
  staffUsers: DbStaffUser[];
  bookings: DbBooking[];
  payments: DbPayment[];
  clearanceTickets: DbClearanceTicket[];
  alerts: DbAlert[];
  expenses: DbExpense[];
  suppliers: DbSupplier[];
  contactInquiries: DbContactInquiry[];
}
