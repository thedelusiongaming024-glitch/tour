"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { clearStaffSession, getStaffUser, staffFetch, type StaffUser } from "@/lib/staffAuth";
import type {
  DbTour,
  DbDestination,
  DbBlogPost,
  DbOffer,
  DbTestimonial,
  DbBooking,
  DbContactInquiry,
  DbHomepageBlock,
  AboutPageCmsContent,
  JournalPageCmsContent,
  AboutValueItem,
  AboutTeamMember,
  HomePageCmsContent,
  WhyUsItem,
  ServiceItem,
} from "@/server/types";

interface AgencyOverview {
  total_revenue: string;
  total_direct_cost: string;
  total_operational_expense: string;
  gross_profit: string;
  net_profit: string;
  bookings_count: number;
  active_tours_count: number;
  pending_advances: string;
  due_on_tour_day: string;
  supplier_payables: string;
}

interface Alert {
  id: string;
  alert_type: string;
  severity: "info" | "warning" | "critical";
  message: string;
  is_acknowledged: boolean;
  created_at: string;
}

type ActiveTab =
  | "overview"
  | "tours"
  | "destinations"
  | "cms"
  | "about_cms"
  | "blog"
  | "offers"
  | "reviews"
  | "bookings"
  | "inquiries";

const DEFAULT_ABOUT_PAGE_CMS: AboutPageCmsContent = {
  hero_eyebrow: "About Atithi",
  hero_title: "Thoughtful journeys across Bangladesh",
  hero_subtitle:
    "Built by local travelers who believe the best trips happen when you're hosted like family, not processed like a transaction.",
  story_badge: "Our Story",
  story_title: "Born out of a simple conviction",
  story_paragraphs: [
    "Most domestic travel in Bangladesh was broken in two ways: either you were on your own navigating erratic transport, unverified hotels, and hidden costs — or you were packed into a thirty-person bus tour with fixed buffets and thirty-minute photo stops.",
    "We wanted something different: trips designed the way an experienced friend would show you their hometown. Small groups, handpicked local hosts, honest pricing, and genuine hospitality.",
    "Today, Atithi runs curated journeys to twelve destinations across Bangladesh — from the tea valleys of Sreemangal to the coral reefs of Saint Martin. Every trip is led by someone who actually lives there.",
  ],
  mission_title: "Our Mission",
  mission_text:
    "To make domestic travel across Bangladesh seamless, transparent, and genuinely memorable — while ensuring tourism directly benefits the local communities and guides who make these places special.",
  values: [
    {
      icon: "shield",
      title: "Radical transparency",
      description:
        "No hidden resort fees, surprise fuel charges, or mandatory tips. Every BDT is accounted for upfront.",
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

const DEFAULT_JOURNAL_PAGE_CMS: JournalPageCmsContent = {
  header_eyebrow: "Travel Journal",
  header_title: "Stories from the road",
  header_description:
    "Field guides, food trails, and honest travel writing from our hosts and guests across Bangladesh.",
  featured_badge: "Latest story",
  empty_title: "No articles published yet",
  empty_description:
    "Stories, packing guides, and field notes will appear here once written and published from the Super Admin Panel.",
};

const DEFAULT_HOME_PAGE_CMS: HomePageCmsContent = {
  hero_eyebrow: "Domestic tours across Bangladesh",
  hero_headline: "Discover Bangladesh,",
  hero_highlight: "your way",
  hero_subheadline: "Curated domestic tours. Trusted local hosts. Book with an advance and clear the balance on tour day.",
  hero_primary_cta_label: "Explore Tours",
  hero_primary_cta_href: "/tours",
  hero_secondary_cta_label: "Plan My Trip",
  hero_secondary_cta_href: "/contact",

  destinations_eyebrow: "Destinations",
  destinations_title: "Popular destinations across Bangladesh",
  destinations_description: "Beaches, hill tracts, mangrove forests, and tea country — pick a place, we'll handle the rest.",
  destinations_cta_label: "All destinations",
  destinations_cta_href: "/destinations",
  destinations_hidden: false,

  tours_eyebrow: "Tour Packages",
  tours_title: "Popular tour packages",
  tours_description: "Small groups, local hosts, and everything included. Filter by place, duration, or price to find your trip in seconds.",
  tours_cta_label: "Browse all tours",
  tours_cta_href: "/tours",
  tours_hidden: false,

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

  offers_eyebrow: "Special Offers",
  offers_title: "A little reason to book today",
  offers_description: "Seasonal savings and group perks — applied automatically at checkout with the right code.",
  offers_hidden: false,

  reviews_eyebrow: "Customer Reviews",
  reviews_title: "Loved by travelers across Bangladesh",
  reviews_description: "Real words from guests who booked, travelled, and settled their balances — all in one seamless flow.",
  reviews_hidden: false,

  journal_eyebrow: "Travel Journal",
  journal_title: "Stories from the road",
  journal_description: "Field guides, food trails, and honest travel writing from our hosts and guests.",
  journal_cta_label: "All stories",
  journal_cta_href: "/journal",
  journal_hidden: false,

  cta_eyebrow: "Atithi — the guest is God",
  cta_title: "Plan your next journey across Bangladesh",
  cta_description: "Tell us where you want to go and when — we'll design a tour around you. Book with a small advance and settle the rest on tour day.",
  cta_primary_label: "Plan My Trip",
  cta_primary_href: "/contact",
  cta_secondary_label: "Browse Tours",
  cta_secondary_href: "/tours",
  cta_hidden: false,
};

function formatBDT(amount: string | number): string {
  return "৳" + Math.round(Number(amount)).toLocaleString("en-BD");
}

const SEVERITY_BADGES: Record<Alert["severity"], string> = {
  critical: "bg-rose-50 text-rose-700 border-rose-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  info: "bg-sky-50 text-sky-700 border-sky-200",
};

export default function StaffDashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 text-slate-600 flex items-center justify-center text-sm font-medium">Loading control center…</div>}>
      <StaffDashboardContent />
    </Suspense>
  );
}

function StaffDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as ActiveTab) || "overview";

  const [user, setUser] = useState<StaffUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Overview data
  const [overview, setOverview] = useState<AgencyOverview | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // CRUD Data states
  const [tours, setTours] = useState<DbTour[]>([]);
  const [destinations, setDestinations] = useState<DbDestination[]>([]);
  const [blogPosts, setBlogPosts] = useState<DbBlogPost[]>([]);
  const [offers, setOffers] = useState<DbOffer[]>([]);
  const [testimonials, setTestimonials] = useState<DbTestimonial[]>([]);
  const [homepageBlocks, setHomepageBlocks] = useState<DbHomepageBlock[]>([]);
  const [bookings, setBookings] = useState<DbBooking[]>([]);
  const [inquiries, setInquiries] = useState<DbContactInquiry[]>([]);

  // Filters & Search
  const [tourSearch, setTourSearch] = useState("");
  const [tourCategoryFilter, setTourCategoryFilter] = useState("all");
  const [destSearch, setDestSearch] = useState("");
  const [destDivisionFilter, setDestDivisionFilter] = useState("all");
  const [bookingStatusFilter, setBookingStatusFilter] = useState("all");

  // Modals
  const [tourModal, setTourModal] = useState<{ isOpen: boolean; tour: Partial<DbTour> | null }>({ isOpen: false, tour: null });
  const [destModal, setDestModal] = useState<{ isOpen: boolean; destination: Partial<DbDestination> | null }>({ isOpen: false, destination: null });
  const [blogModal, setBlogModal] = useState<{ isOpen: boolean; post: Partial<DbBlogPost> | null }>({ isOpen: false, post: null });
  const [offerModal, setOfferModal] = useState<{ isOpen: boolean; offer: Partial<DbOffer> | null }>({ isOpen: false, offer: null });
  const [reviewModal, setReviewModal] = useState<{ isOpen: boolean; review: Partial<DbTestimonial> | null }>({ isOpen: false, review: null });
  const [inquiryModal, setInquiryModal] = useState<{ isOpen: boolean; inquiry: DbContactInquiry | null }>({ isOpen: false, inquiry: null });

  // CMS state
  const [homeCms, setHomeCms] = useState<HomePageCmsContent>(DEFAULT_HOME_PAGE_CMS);
  const [heroCms, setHeroCms] = useState({
    eyebrow: "Premium domestic tours across Bangladesh",
    headline: "Discover Bangladesh,",
    highlight: "your way",
    subheadline: "Curated domestic tours. Trusted local hosts. Book with a small advance and clear the balance on tour day.",
    primary_cta_label: "Explore Tours",
    primary_cta_href: "/tours",
    secondary_cta_label: "Plan My Trip",
    secondary_cta_href: "/contact",
  });
  const [aboutCms, setAboutCms] = useState<AboutPageCmsContent>(DEFAULT_ABOUT_PAGE_CMS);
  const [journalCms, setJournalCms] = useState<JournalPageCmsContent>(DEFAULT_JOURNAL_PAGE_CMS);
  const [sectionToggles, setSectionToggles] = useState({
    hideDestinations: false,
    hideFeaturedTours: false,
    hideTestimonials: false,
  });

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    setUser(getStaffUser());
    setAuthChecked(true);
  }, []);

  useEffect(() => {
    if (!authChecked) return;
    if (!user) {
      router.replace("/staff/login?next=/staff/dashboard");
    }
  }, [authChecked, user, router]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [overviewRes, alertsRes] = await Promise.all([
        staffFetch("/finance/overview"),
        staffFetch("/alerts?is_acknowledged=false"),
      ]);
      if (overviewRes.ok) setOverview(await overviewRes.json());
      if (alertsRes.ok) {
        const d = await alertsRes.json();
        setAlerts(d.results ?? d);
      }

      const [toursRes, destsRes, blogRes, offersRes, reviewsRes, cmsRes, bookingsRes, inquiriesRes] = await Promise.all([
        staffFetch("/admin/tours"),
        staffFetch("/admin/destinations"),
        staffFetch("/admin/blog-posts"),
        staffFetch("/admin/offers"),
        staffFetch("/admin/testimonials"),
        staffFetch("/admin/cms"),
        staffFetch("/admin/bookings"),
        staffFetch("/admin/inquiries"),
      ]);

      if (toursRes.ok) setTours((await toursRes.json()).results || []);
      if (destsRes.ok) setDestinations((await destsRes.json()).results || []);
      if (blogRes.ok) setBlogPosts((await blogRes.json()).results || []);
      if (offersRes.ok) setOffers((await offersRes.json()).results || []);
      if (reviewsRes.ok) setTestimonials((await reviewsRes.json()).results || []);
      if (bookingsRes.ok) setBookings((await bookingsRes.json()).results || []);
      if (inquiriesRes.ok) setInquiries((await inquiriesRes.json()).results || []);

      if (cmsRes.ok) {
        const blocks: DbHomepageBlock[] = (await cmsRes.json()).results || [];
        setHomepageBlocks(blocks);
        const homeBlock = blocks.find((b) => b.block_type === "home_page" || b.id === "block-home-page");
        if (homeBlock && homeBlock.content) {
          setHomeCms((prev) => ({ ...prev, ...(homeBlock.content as Partial<HomePageCmsContent>) }));
        }
        const heroBlock = blocks.find((b) => b.block_type === "hero");
        if (heroBlock && heroBlock.content) {
          setHeroCms((prev) => ({ ...prev, ...(heroBlock.content as Record<string, string>) }));
        }
        const aboutBlock = blocks.find((b) => b.block_type === "about_page" || b.id === "block-about-page");
        if (aboutBlock && aboutBlock.content) {
          setAboutCms((prev) => ({ ...prev, ...(aboutBlock.content as Partial<AboutPageCmsContent>) }));
        }
        const journalBlock = blocks.find((b) => b.block_type === "journal_page" || b.id === "block-journal-page");
        if (journalBlock && journalBlock.content) {
          setJournalCms((prev) => ({ ...prev, ...(journalBlock.content as Partial<JournalPageCmsContent>) }));
        }
        const destBlock = blocks.find((b) => b.block_type === "destination_grid");
        const tourBlock = blocks.find((b) => b.block_type === "featured_tours");
        const testBlock = blocks.find((b) => b.block_type === "testimonials");
        setSectionToggles({
          hideDestinations: (destBlock?.content as { hidden?: boolean })?.hidden === true,
          hideFeaturedTours: (tourBlock?.content as { hidden?: boolean })?.hidden === true,
          hideTestimonials: (testBlock?.content as { hidden?: boolean })?.hidden === true,
        });
      }
    } catch {
      showNotification("error", "Could not synchronize dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authChecked && user) {
      loadData();
    }
  }, [authChecked, user, loadData]);

  async function acknowledgeAlert(id: string) {
    const previous = alerts;
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    const res = await staffFetch(`/alerts/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ is_acknowledged: true }),
    });
    if (!res.ok) {
      setAlerts(previous);
      showNotification("error", "Failed to acknowledge alert");
    } else {
      showNotification("success", "Alert acknowledged");
    }
  }

  // Tour Handlers
  async function handleSaveTour(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const tour = tourModal.tour || {};

    const basePrice = formData.get("base_price") as string;
    const discountValue = (formData.get("discount_value") as string) || "0";
    const destSlug = (formData.get("destination_slug") as string) || destinations[0]?.slug || "bangladesh";
    const matchDest = destinations.find((d) => d.slug === destSlug);

    const payload: Partial<DbTour> = {
      id: tour.id,
      title: formData.get("title") as string,
      slug: (formData.get("slug") as string) || (formData.get("title") as string).toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      destination_slug: destSlug,
      destination_name: matchDest?.name || destSlug,
      category: formData.get("category") as string,
      short_description: formData.get("short_description") as string,
      full_description: formData.get("full_description") as string,
      hero_image: (formData.get("hero_image") as string) || null,
      duration_days: Number(formData.get("duration_days")),
      duration_nights: Number(formData.get("duration_nights")),
      base_price: basePrice,
      discount_type: Number(discountValue) > 0 ? "flat" : "none",
      discount_value: discountValue,
      final_price: String(Math.max(0, Number(basePrice) - Number(discountValue))),
      allow_partial_payment: formData.get("allow_partial_payment") === "on",
      advance_payment_percent: formData.get("advance_payment_percent") as string,
      advance_amount: String(Math.round((Math.max(0, Number(basePrice) - Number(discountValue)) * Number(formData.get("advance_payment_percent") || 40)) / 100)),
      inclusions: ((formData.get("inclusions") as string) || "").split(",").map((s) => s.trim()).filter(Boolean),
      exclusions: ((formData.get("exclusions") as string) || "").split(",").map((s) => s.trim()).filter(Boolean),
      accommodation_notes: formData.get("accommodation_notes") as string,
      transportation_notes: formData.get("transportation_notes") as string,
      meals_notes: formData.get("meals_notes") as string,
      meeting_point: formData.get("meeting_point") as string,
      departure_schedule: formData.get("departure_schedule") as string,
      total_seats: Number(formData.get("total_seats") || 14),
      is_featured: formData.get("is_featured") === "on",
      status: formData.get("status") as "published" | "draft",
    };

    const isEdit = Boolean(tour.id);
    const url = isEdit ? `/admin/tours/${tour.id}` : "/admin/tours";
    const method = isEdit ? "PUT" : "POST";

    const res = await staffFetch(url, {
      method,
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      showNotification("success", `Tour package ${isEdit ? "updated" : "created"} successfully.`);
      setTourModal({ isOpen: false, tour: null });
      loadData();
    } else {
      showNotification("error", "Failed to save tour package.");
    }
  }

  async function handleDeleteTour(id: string) {
    if (!confirm("Are you sure you want to delete this tour package?")) return;
    const res = await staffFetch(`/admin/tours/${id}`, { method: "DELETE" });
    if (res.ok) {
      showNotification("success", "Tour package deleted.");
      loadData();
    } else {
      showNotification("error", "Failed to delete tour package.");
    }
  }

  async function handleToggleTourStatus(tour: DbTour) {
    const nextStatus = tour.status === "published" ? "draft" : "published";
    const res = await staffFetch(`/admin/tours/${tour.id}`, {
      method: "PUT",
      body: JSON.stringify({ ...tour, status: nextStatus }),
    });
    if (res.ok) {
      showNotification("success", `Tour status changed to ${nextStatus}.`);
      loadData();
    }
  }

  // Destination Handlers
  async function handleSaveDestination(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const dest = destModal.destination || {};

    const payload: Partial<DbDestination> = {
      id: dest.id,
      name: formData.get("name") as string,
      slug: (formData.get("slug") as string) || (formData.get("name") as string).toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      division: formData.get("division") as string,
      tagline: formData.get("tagline") as string,
      description: formData.get("description") as string,
      best_time_to_visit: formData.get("best_time_to_visit") as string,
      weather_notes: formData.get("weather_notes") as string,
      popular_attractions: ((formData.get("popular_attractions") as string) || "").split(",").map((s) => s.trim()).filter(Boolean),
      recommended_accommodation: formData.get("recommended_accommodation") as string,
      travel_tips: formData.get("travel_tips") as string,
      cover_image: (formData.get("cover_image") as string) || null,
      cover_video_url: (formData.get("cover_video_url") as string) || "",
      is_featured: formData.get("is_featured") === "on",
      status: formData.get("status") as "published" | "draft",
    };

    const isEdit = Boolean(dest.id);
    const url = isEdit ? `/admin/destinations/${dest.id}` : "/admin/destinations";
    const method = isEdit ? "PUT" : "POST";

    const res = await staffFetch(url, {
      method,
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      showNotification("success", `Destination ${isEdit ? "updated" : "created"} successfully.`);
      setDestModal({ isOpen: false, destination: null });
      loadData();
    } else {
      showNotification("error", "Failed to save destination.");
    }
  }

  async function handleDeleteDestination(id: string) {
    if (!confirm("Are you sure you want to delete this destination?")) return;
    const res = await staffFetch(`/admin/destinations/${id}`, { method: "DELETE" });
    if (res.ok) {
      showNotification("success", "Destination removed.");
      loadData();
    } else {
      showNotification("error", "Failed to delete destination.");
    }
  }

  // Blog Handlers
  async function handleSaveBlog(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const post = blogModal.post || {};
    const content = (formData.get("content") as string) || "";
    const catName = (formData.get("category") as string) || "Travel Guide";
    const author = (formData.get("author") as string) || "Atithi Editorial Team";
    const heroImage = (formData.get("hero_image") as string) || null;
    const excerpt = (formData.get("excerpt") as string) || content.slice(0, 160);
    const isFeatured = formData.get("is_featured") === "on";

    const payload: Partial<DbBlogPost> = {
      id: post.id,
      title: formData.get("title") as string,
      slug: (formData.get("slug") as string) || (formData.get("title") as string).toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      author,
      author_name: author,
      category: { name: catName },
      body: content,
      content,
      excerpt,
      cover_image: heroImage,
      hero_image: heroImage,
      read_time_minutes: Number(formData.get("read_time_minutes") || 5),
      tags: ((formData.get("tags") as string) || "").split(",").map((s) => s.trim()).filter(Boolean),
      status: formData.get("is_published") === "on" ? "published" : "draft",
      is_published: formData.get("is_published") === "on",
      is_featured: isFeatured,
    };

    const isEdit = Boolean(post.id);
    const url = isEdit ? `/admin/blog-posts/${post.id}` : "/admin/blog-posts";
    const method = isEdit ? "PUT" : "POST";

    const res = await staffFetch(url, { method, body: JSON.stringify(payload) });
    if (res.ok) {
      showNotification("success", `Article ${isEdit ? "updated" : "published"} successfully.`);
      setBlogModal({ isOpen: false, post: null });
      loadData();
    } else {
      showNotification("error", "Failed to save article.");
    }
  }

  async function handleDeleteBlog(id: string) {
    if (!confirm("Are you sure you want to delete this article?")) return;
    const res = await staffFetch(`/admin/blog-posts/${id}`, { method: "DELETE" });
    if (res.ok) {
      showNotification("success", "Article removed.");
      loadData();
    } else {
      showNotification("error", "Failed to delete article.");
    }
  }

  async function handleToggleBlogStatus(post: DbBlogPost) {
    const nextStatus = post.status === "published" ? "draft" : "published";
    const res = await staffFetch(`/admin/blog-posts/${post.id}`, {
      method: "PUT",
      body: JSON.stringify({ ...post, status: nextStatus, is_published: nextStatus === "published" }),
    });
    if (res.ok) {
      showNotification("success", `Article status changed to ${nextStatus}.`);
      loadData();
    }
  }

  async function handleToggleBlogFeatured(post: DbBlogPost) {
    const nextFeatured = !post.is_featured;
    const res = await staffFetch(`/admin/blog-posts/${post.id}`, {
      method: "PUT",
      body: JSON.stringify({ ...post, is_featured: nextFeatured }),
    });
    if (res.ok) {
      showNotification("success", nextFeatured ? "Article marked as featured!" : "Article unmarked from featured.");
      loadData();
    }
  }

  // Offer Handlers
  async function handleSaveOffer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const offer = offerModal.offer || {};
    const code = (formData.get("code") as string) || "PROMO";

    const payload: Partial<DbOffer> = {
      id: offer.id,
      code,
      slug: code.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      discount_type: formData.get("discount_type") as "percent" | "flat",
      discount_value: formData.get("discount_value") as string,
      minimum_spend: (formData.get("minimum_spend") as string) || "0",
      valid_from: formData.get("valid_from") as string,
      valid_until: (formData.get("valid_until") as string) || new Date(Date.now() + 30 * 86400000).toISOString(),
      banner_image: (formData.get("banner_image") as string) || null,
      is_active: formData.get("is_active") === "on",
    };

    const isEdit = Boolean(offer.id);
    const url = isEdit ? `/admin/offers/${offer.id}` : "/admin/offers";
    const method = isEdit ? "PUT" : "POST";

    const res = await staffFetch(url, { method, body: JSON.stringify(payload) });
    if (res.ok) {
      showNotification("success", "Promotional offer saved.");
      setOfferModal({ isOpen: false, offer: null });
      loadData();
    }
  }

  async function handleDeleteOffer(id: string) {
    if (!confirm("Are you sure you want to delete this offer?")) return;
    const res = await staffFetch(`/admin/offers/${id}`, { method: "DELETE" });
    if (res.ok) {
      showNotification("success", "Offer removed.");
      loadData();
    }
  }

  // Review Handlers
  async function handleSaveReview(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const rev = reviewModal.review || {};
    const authorName = formData.get("author_name") as string;
    const tourTitle = (formData.get("trip_name") as string) || "Bangladesh Tour";
    const photo = (formData.get("author_avatar") as string) || null;

    const payload: Partial<DbTestimonial> = {
      id: rev.id,
      customer_name: authorName,
      author_name: authorName,
      tour_title: tourTitle,
      trip_name: tourTitle,
      author_location: (formData.get("author_location") as string) || "Bangladesh",
      rating: Number(formData.get("rating")),
      quote: formData.get("quote") as string,
      customer_photo: photo,
      author_avatar: photo,
      is_featured: formData.get("is_featured") === "on",
    };

    const isEdit = Boolean(rev.id);
    const url = isEdit ? `/admin/testimonials/${rev.id}` : "/admin/testimonials";
    const method = isEdit ? "PUT" : "POST";

    const res = await staffFetch(url, { method, body: JSON.stringify(payload) });
    if (res.ok) {
      showNotification("success", "Testimonial saved.");
      setReviewModal({ isOpen: false, review: null });
      loadData();
    }
  }

  async function handleDeleteReview(id: string) {
    if (!confirm("Are you sure you want to delete this testimonial?")) return;
    const res = await staffFetch(`/admin/testimonials/${id}`, { method: "DELETE" });
    if (res.ok) {
      showNotification("success", "Testimonial removed.");
      loadData();
    }
  }

  // CMS Handlers
  async function handleSaveCms() {
    try {
      const res = await staffFetch("/admin/cms", {
        method: "POST",
        body: JSON.stringify({
          id: "block-home-page",
          block_type: "home_page",
          content: homeCms,
        }),
      });
      if (res.ok) {
        showNotification("success", "Homepage configurations updated and published live!");
        loadData();
      } else {
        showNotification("error", "Failed to save CMS configurations.");
      }
    } catch {
      showNotification("error", "Failed to save CMS configurations.");
    }
  }

  // About Page CMS Handler
  async function handleSaveAboutCms() {
    try {
      const res = await staffFetch("/admin/cms", {
        method: "POST",
        body: JSON.stringify({
          id: "block-about-page",
          block_type: "about_page",
          content: aboutCms,
        }),
      });
      if (res.ok) {
        showNotification("success", "About page customization saved and live!");
        loadData();
      } else {
        showNotification("error", "Failed to save About page customization.");
      }
    } catch {
      showNotification("error", "Failed to save About page customization.");
    }
  }

  // Journal Page CMS Settings Handler
  async function handleSaveJournalCms() {
    try {
      const res = await staffFetch("/admin/cms", {
        method: "POST",
        body: JSON.stringify({
          id: "block-journal-page",
          block_type: "journal_page",
          content: journalCms,
        }),
      });
      if (res.ok) {
        showNotification("success", "Journal page settings saved and live!");
        loadData();
      } else {
        showNotification("error", "Failed to save Journal page settings.");
      }
    } catch {
      showNotification("error", "Failed to save Journal page settings.");
    }
  }

  // Booking status updater
  async function handleUpdateBookingStatus(id: string, newStatus: string) {
    const res = await staffFetch("/admin/bookings", {
      method: "PATCH",
      body: JSON.stringify({ id, status: newStatus }),
    });
    if (res.ok) {
      showNotification("success", `Booking status updated to ${newStatus}.`);
      loadData();
    } else {
      showNotification("error", "Failed to update booking status.");
    }
  }

  // Inquiry updater
  async function handleSaveInquiry(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!inquiryModal.inquiry) return;
    const formData = new FormData(e.currentTarget);
    const status = formData.get("status") as DbContactInquiry["status"];
    const adminNotes = formData.get("admin_notes") as string;

    const res = await staffFetch("/admin/inquiries", {
      method: "PATCH",
      body: JSON.stringify({
        id: inquiryModal.inquiry.id,
        status,
        admin_notes: adminNotes,
      }),
    });

    if (res.ok) {
      showNotification("success", "Inquiry updated.");
      setInquiryModal({ isOpen: false, inquiry: null });
      loadData();
    } else {
      showNotification("error", "Failed to update inquiry.");
    }
  }

  if (!authChecked || !user) return null;

  const isSuperAdmin = user.role === "super_admin";

  const filteredTours = tours.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(tourSearch.toLowerCase()) || t.destination_name.toLowerCase().includes(tourSearch.toLowerCase());
    const matchesCat = tourCategoryFilter === "all" || t.category === tourCategoryFilter;
    return matchesSearch && matchesCat;
  });

  const filteredDestinations = destinations.filter((d) => {
    const matchesSearch = d.name.toLowerCase().includes(destSearch.toLowerCase()) || d.division.toLowerCase().includes(destSearch.toLowerCase());
    const matchesDiv = destDivisionFilter === "all" || d.division.toLowerCase() === destDivisionFilter.toLowerCase();
    return matchesSearch && matchesDiv;
  });

  const filteredBookings = bookings.filter((b) => {
    if (bookingStatusFilter === "all") return true;
    return b.status === bookingStatusFilter;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased flex flex-col font-sans">
      {/* Top Professional Header */}
      <header className="border-b border-slate-200 bg-white px-6 py-3.5 sticky top-0 z-30 shadow-xs">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-700 text-white font-bold text-sm tracking-tight">
              A
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-semibold text-slate-900 text-base tracking-tight">Atithi Admin</h1>
                <span className="rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 text-xs font-medium">
                  {user.role === "super_admin" ? "Super Admin" : user.role}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 text-xs font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Supabase Cloud
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Connected user: <span className="font-medium text-slate-700">{user.username}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 text-xs sm:text-sm">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition font-medium flex items-center gap-1.5"
            >
              <span>Public Website</span>
              <span className="text-slate-400">↗</span>
            </a>
            <a
              href="/staff/scan"
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition font-medium"
            >
              QR Scanner
            </a>
            <button
              onClick={() => loadData()}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition font-medium"
              title="Refresh datasets"
            >
              Refresh
            </button>
            <button
              onClick={() => {
                clearStaffSession();
                router.push("/staff/login");
              }}
              className="rounded-lg border border-rose-200 bg-rose-50 text-rose-700 px-3 py-1.5 hover:bg-rose-100 transition font-medium"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-16 right-6 z-50 rounded-xl px-4 py-3 text-sm font-medium shadow-lg border transition-all ${
            notification.type === "success"
              ? "bg-white text-emerald-900 border-emerald-200 shadow-emerald-900/5"
              : "bg-white text-rose-900 border-rose-200 shadow-rose-900/5"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${notification.type === "success" ? "bg-emerald-600" : "bg-rose-600"}`} />
            {notification.message}
          </div>
        </div>
      )}

      {/* Clean Tab Navigation */}
      <div className="border-b border-slate-200 bg-white px-6">
        <div className="mx-auto max-w-7xl flex gap-1 overflow-x-auto py-2 scrollbar-none">
          {[
            { id: "overview", label: "Overview", count: null },
            ...(isSuperAdmin
              ? [
                  { id: "tours", label: "Tours", count: tours.length },
                  { id: "destinations", label: "Destinations", count: destinations.length },
                  { id: "cms", label: "Homepage CMS", count: null },
                  { id: "about_cms", label: "About Page CMS", count: null },
                  { id: "blog", label: "Travel Journal", count: blogPosts.length },
                  { id: "offers", label: "Special Offers", count: offers.length },
                  { id: "reviews", label: "Testimonials", count: testimonials.length },
                  { id: "bookings", label: "Bookings", count: bookings.length },
                  { id: "inquiries", label: "Inquiries", count: inquiries.length },
                ]
              : []),
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ActiveTab)}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-medium whitespace-nowrap transition ${
                activeTab === tab.id
                  ? "bg-slate-100 text-slate-900 font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span className={`rounded-full px-1.5 py-0.2 text-[11px] font-semibold ${
                  activeTab === tab.id ? "bg-white text-slate-800 border border-slate-200" : "bg-slate-100 text-slate-500"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 mx-auto max-w-7xl w-full p-6 sm:p-8">
        {loading && (
          <div className="mb-4 flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span className="inline-block h-2 w-2 animate-spin rounded-full border border-slate-500 border-t-transparent" />
            Updating datasets…
          </div>
        )}

        {/* ================= OVERVIEW TAB ================= */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Quick Actions Card */}
            {isSuperAdmin && (
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">Quick Actions</h2>
                    <p className="text-xs text-slate-500">Fast shortcuts to add new packages or update homepage configuration</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setTourModal({ isOpen: true, tour: null })}
                      className="rounded-lg bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-800 transition shadow-xs"
                    >
                      + Add Tour Package
                    </button>
                    <button
                      onClick={() => setDestModal({ isOpen: true, destination: null })}
                      className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      + Add Destination
                    </button>
                    <button
                      onClick={() => setActiveTab("cms")}
                      className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      Configure Homepage
                    </button>
                    <button
                      onClick={() => setActiveTab("about_cms")}
                      className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      Configure About Us Page
                    </button>
                    <button
                      onClick={() => setBlogModal({ isOpen: true, post: null })}
                      className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      + New Journal Post
                    </button>
                    <button
                      onClick={() => setOfferModal({ isOpen: true, offer: null })}
                      className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      + New Promo Code
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Supabase Cloud Database Status Banner */}
            <div className="rounded-xl border border-emerald-100 bg-white p-4 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 text-xs">
                    DB
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">Online Database: Supabase Connected</h3>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.2 text-[11px] font-medium text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Active Cloud Sync
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Cloud Host: <span className="font-mono text-slate-700 font-medium">tcituxdzdqjgslhctncu.supabase.co</span> • Bucket: <span className="font-mono text-slate-700 font-medium">atithi-data</span> • PostgreSQL schema ready
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 font-medium bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                    Dual-Layer Persistence (Instant Local + Cloud Backup)
                  </span>
                </div>
              </div>
            </div>

            {/* Profit Dashboard Section */}
            <div>
              <div className="mb-3">
                <h2 className="text-xs uppercase tracking-wider font-semibold text-slate-500">Financial Summary</h2>
                <p className="text-sm font-medium text-slate-800">Operational revenue, costs, and current margins</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                  <p className="text-xs uppercase tracking-wide font-medium text-slate-500">Revenue</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{formatBDT(overview?.total_revenue ?? 0)}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                  <p className="text-xs uppercase tracking-wide font-medium text-slate-500">Direct Costs</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{formatBDT(overview?.total_direct_cost ?? 0)}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                  <p className="text-xs uppercase tracking-wide font-medium text-slate-500">Gross Margin</p>
                  <p className={`mt-2 text-2xl font-bold ${Number(overview?.gross_profit) >= 0 ? "text-emerald-700" : "text-slate-900"}`}>
                    {formatBDT(overview?.gross_profit ?? 0)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                  <p className="text-xs uppercase tracking-wide font-medium text-slate-500">Operating Expenses</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{formatBDT(overview?.total_operational_expense ?? 0)}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                  <p className="text-xs uppercase tracking-wide font-medium text-slate-500">Net Profit</p>
                  <p className={`mt-2 text-2xl font-bold ${Number(overview?.net_profit) >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
                    {formatBDT(overview?.net_profit ?? 0)}
                  </p>
                </div>
              </div>
            </div>

            {/* Receivables & Inventory */}
            <div>
              <div className="mb-3">
                <h2 className="text-xs uppercase tracking-wider font-semibold text-slate-500">Receivables & Operational Capacity</h2>
                <p className="text-sm font-medium text-slate-800">Booking counts, pending advances, and balance due on tour day</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs cursor-pointer hover:border-slate-300 transition" onClick={() => setActiveTab("bookings")}>
                  <p className="text-xs uppercase tracking-wide font-medium text-slate-500">Total Bookings</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{overview?.bookings_count ?? bookings.length}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs cursor-pointer hover:border-slate-300 transition" onClick={() => setActiveTab("tours")}>
                  <p className="text-xs uppercase tracking-wide font-medium text-slate-500">Published Tours</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{overview?.active_tours_count ?? tours.length}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                  <p className="text-xs uppercase tracking-wide font-medium text-slate-500">Pending Advances</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{formatBDT(overview?.pending_advances ?? 0)}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                  <p className="text-xs uppercase tracking-wide font-medium text-slate-500">Due On Tour Day</p>
                  <p className="mt-2 text-2xl font-bold text-amber-700">{formatBDT(overview?.due_on_tour_day ?? 0)}</p>
                </div>
              </div>
            </div>

            {/* Operational Alerts */}
            <div>
              <h2 className="text-xs uppercase tracking-wider font-semibold text-slate-500 mb-3">
                System & Operational Alerts ({alerts.length})
              </h2>
              {alerts.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-xs">
                  No pending operational alerts. All departures and bookings are clear.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {alerts.map((a) => (
                    <div
                      key={a.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`rounded-md border px-2 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                          SEVERITY_BADGES[a.severity] || "bg-slate-100 text-slate-700 border-slate-200"
                        }`}>
                          {a.severity}
                        </span>
                        <span className="text-slate-800">{a.message}</span>
                      </div>
                      <button
                        onClick={() => acknowledgeAlert(a.id)}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 transition"
                      >
                        Acknowledge
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Tables Snapshot */}
            {isSuperAdmin && (
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-slate-900">Recent Customer Bookings</h3>
                    <button
                      onClick={() => setActiveTab("bookings")}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                    >
                      View All ({bookings.length}) →
                    </button>
                  </div>
                  {bookings.length === 0 ? (
                    <p className="text-xs text-slate-500">No bookings recorded yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {bookings.slice(0, 4).map((b) => (
                        <div key={b.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/70 p-3 text-xs">
                          <div>
                            <span className="font-mono font-medium text-slate-900">{b.reference}</span>
                            <span className="text-slate-600 ml-2">{b.customer_full_name}</span>
                            <div className="text-slate-500 mt-0.5">{b.tour_title}</div>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold text-slate-900">{formatBDT(b.amount_paid)}</span>
                            <div className="text-[11px] text-emerald-700 font-medium mt-0.5">{b.status}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-slate-900">Recent Inquiries</h3>
                    <button
                      onClick={() => setActiveTab("inquiries")}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                    >
                      View All ({inquiries.length}) →
                    </button>
                  </div>
                  {inquiries.length === 0 ? (
                    <p className="text-xs text-slate-500">No inquiries recorded yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {inquiries.slice(0, 4).map((inq) => (
                        <div key={inq.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/70 p-3 text-xs">
                          <div>
                            <span className="font-medium text-slate-900">{inq.name}</span>
                            <span className="text-slate-500 ml-2">{inq.phone}</span>
                            <div className="text-slate-500 mt-0.5">Dest: {inq.destination || "Custom"}</div>
                          </div>
                          <button
                            onClick={() => setInquiryModal({ isOpen: true, inquiry: inq })}
                            className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                          >
                            Follow up
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TOURS TAB ================= */}
        {activeTab === "tours" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Tour Packages</h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Manage departures, pricing, advance payment requirements, and detailed itineraries
                </p>
              </div>
              <button
                onClick={() => setTourModal({ isOpen: true, tour: null })}
                className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 transition shadow-xs"
              >
                + Add Tour Package
              </button>
            </div>

            {/* Filter Toolbar */}
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                placeholder="Search by tour title or destination…"
                value={tourSearch}
                onChange={(e) => setTourSearch(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs sm:text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 min-w-[260px] shadow-xs"
              />
              <select
                value={tourCategoryFilter}
                onChange={(e) => setTourCategoryFilter(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs sm:text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
              >
                <option value="all">All Categories</option>
                <option value="group_tour">Group Tour</option>
                <option value="private_tour">Private Tour</option>
                <option value="honeymoon_package">Honeymoon Package</option>
                <option value="adventure_tour">Adventure Tour</option>
                <option value="family_tour">Family Tour</option>
                <option value="weekend_getaway">Weekend Getaway</option>
              </select>
              <span className="text-xs text-slate-500 ml-auto">
                Showing {filteredTours.length} of {tours.length} tours
              </span>
            </div>

            {/* Tours Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTours.map((t) => (
                <div key={t.id} className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col justify-between shadow-xs hover:border-slate-300 transition">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2.5">
                      <span className="font-semibold text-emerald-800 uppercase tracking-wider text-[11px]">{t.category}</span>
                      <button
                        onClick={() => handleToggleTourStatus(t)}
                        className={`px-2.5 py-0.5 rounded-full border text-[11px] font-medium transition cursor-pointer ${
                          t.status === "published"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                        }`}
                        title="Click to toggle status"
                      >
                        {t.status === "published" ? "Published" : "Draft"}
                      </button>
                    </div>

                    <h3 className="font-semibold text-base text-slate-900">{t.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {t.destination_name} · {t.duration_days} Days / {t.duration_nights} Nights · {t.total_seats} Seats
                    </p>
                    <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 mt-3 leading-relaxed">{t.short_description}</p>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-baseline gap-2">
                      <span className="text-lg font-bold text-slate-900">{formatBDT(t.final_price)}</span>
                      {Number(t.discount_value) > 0 && (
                        <span className="text-xs text-slate-400 line-through">{formatBDT(t.base_price)}</span>
                      )}
                      <span className="text-xs text-slate-500 ml-auto font-medium">{t.advance_payment_percent}% advance required</span>
                    </div>

                    <div className="mt-2 text-xs text-slate-500">
                      {t.departures?.length || 0} active scheduled departure(s)
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      onClick={() => setTourModal({ isOpen: true, tour: t })}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                    >
                      Edit Details
                    </button>
                    <button
                      onClick={() => handleDeleteTour(t.id)}
                      className="rounded-lg border border-rose-200 bg-rose-50 text-rose-700 px-3 py-1.5 text-xs font-medium hover:bg-rose-100 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= DESTINATIONS TAB ================= */}
        {activeTab === "destinations" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Destinations</h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Regional tourist destinations, attraction listings, weather notes, and guides
                </p>
              </div>
              <button
                onClick={() => setDestModal({ isOpen: true, destination: null })}
                className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 transition shadow-xs"
              >
                + Add Destination
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                placeholder="Search by destination name or division…"
                value={destSearch}
                onChange={(e) => setDestSearch(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs sm:text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 min-w-[260px] shadow-xs"
              />
              <select
                value={destDivisionFilter}
                onChange={(e) => setDestDivisionFilter(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs sm:text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
              >
                <option value="all">All Divisions</option>
                <option value="chattogram">Chattogram</option>
                <option value="sylhet">Sylhet</option>
                <option value="khulna">Khulna</option>
                <option value="dhaka">Dhaka</option>
                <option value="barishal">Barishal</option>
                <option value="rajshahi">Rajshahi</option>
              </select>
              <span className="text-xs text-slate-500 ml-auto">
                Showing {filteredDestinations.length} of {destinations.length} destinations
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredDestinations.map((d) => (
                <div key={d.id} className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col justify-between shadow-xs hover:border-slate-300 transition">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="uppercase tracking-wider font-semibold text-emerald-800 text-[11px]">{d.division} Division</span>
                      <span className={`px-2 py-0.5 rounded-full border text-[11px] font-medium ${
                        d.status === "published"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}>
                        {d.status}
                      </span>
                    </div>
                    <h3 className="font-semibold text-base text-slate-900">{d.name}</h3>
                    {d.tagline && <p className="text-xs text-slate-600 italic mt-0.5">{d.tagline}</p>}
                    <p className="text-xs text-slate-500 mt-1">Best Season: {d.best_time_to_visit}</p>
                    <p className="text-sm text-slate-600 line-clamp-2 mt-3 leading-relaxed">{d.description}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {d.popular_attractions?.slice(0, 3).map((a) => (
                        <span key={a} className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700 font-medium">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      onClick={() => setDestModal({ isOpen: true, destination: d })}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteDestination(d.id)}
                      className="rounded-lg border border-rose-200 bg-rose-50 text-rose-700 px-3 py-1.5 text-xs font-medium hover:bg-rose-100 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= FRONTEND CMS CUSTOMIZER TAB ================= */}
        {activeTab === "cms" && (
          <div className="max-w-4xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Homepage Full Live Customizer</h2>
                <p className="text-sm text-slate-500">
                  Full control over all 9 sections: headlines, subtitles, feature cards, services, and display toggles
                </p>
              </div>
              <button
                type="button"
                onClick={handleSaveCms}
                className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800 transition shadow-xs"
              >
                Publish Changes to Homepage
              </button>
            </div>

            {/* 1. HERO SECTION */}
            <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">1. Hero Section (Top Banner)</h3>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                  Eyebrow Badge Text
                  <input
                    value={homeCms.hero_eyebrow ?? ""}
                    onChange={(e) => setHomeCms({ ...homeCms, hero_eyebrow: e.target.value })}
                    className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                    placeholder="e.g. Domestic tours across Bangladesh"
                  />
                </label>

                <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                  Headline (Line 1)
                  <input
                    value={homeCms.hero_headline ?? ""}
                    onChange={(e) => setHomeCms({ ...homeCms, hero_headline: e.target.value })}
                    className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                    placeholder="e.g. Discover Bangladesh,"
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                Highlighted Phrase (Line 2 - Emerald Accent)
                <input
                  value={homeCms.hero_highlight ?? ""}
                  onChange={(e) => setHomeCms({ ...homeCms, hero_highlight: e.target.value })}
                  className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  placeholder="e.g. your way"
                />
              </label>

              <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                Subheadline Description
                <textarea
                  rows={3}
                  value={homeCms.hero_subheadline ?? ""}
                  onChange={(e) => setHomeCms({ ...homeCms, hero_subheadline: e.target.value })}
                  className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  placeholder="Describe your agency's promise..."
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-slate-100">
                <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                  Primary Button Label
                  <input
                    value={homeCms.hero_primary_cta_label ?? ""}
                    onChange={(e) => setHomeCms({ ...homeCms, hero_primary_cta_label: e.target.value })}
                    className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  />
                </label>

                <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                  Primary Button URL
                  <input
                    value={homeCms.hero_primary_cta_href ?? ""}
                    onChange={(e) => setHomeCms({ ...homeCms, hero_primary_cta_href: e.target.value })}
                    className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                  Secondary Button Label
                  <input
                    value={homeCms.hero_secondary_cta_label ?? ""}
                    onChange={(e) => setHomeCms({ ...homeCms, hero_secondary_cta_label: e.target.value })}
                    className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  />
                </label>

                <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                  Secondary Button URL
                  <input
                    value={homeCms.hero_secondary_cta_href ?? ""}
                    onChange={(e) => setHomeCms({ ...homeCms, hero_secondary_cta_href: e.target.value })}
                    className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  />
                </label>
              </div>
            </div>

            {/* 2. POPULAR DESTINATIONS SECTION */}
            <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">2. Popular Destinations Grid</h3>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={homeCms.destinations_hidden === true}
                    onChange={(e) => setHomeCms({ ...homeCms, destinations_hidden: e.target.checked })}
                    className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 h-4 w-4"
                  />
                  Hide this section on homepage
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                  Eyebrow Badge Text
                  <input
                    value={homeCms.destinations_eyebrow ?? ""}
                    onChange={(e) => setHomeCms({ ...homeCms, destinations_eyebrow: e.target.value })}
                    className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                  Section Title
                  <input
                    value={homeCms.destinations_title ?? ""}
                    onChange={(e) => setHomeCms({ ...homeCms, destinations_title: e.target.value })}
                    className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                Section Description
                <textarea
                  rows={2}
                  value={homeCms.destinations_description ?? ""}
                  onChange={(e) => setHomeCms({ ...homeCms, destinations_description: e.target.value })}
                  className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-slate-100">
                <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                  Action Button Label
                  <input
                    value={homeCms.destinations_cta_label ?? ""}
                    onChange={(e) => setHomeCms({ ...homeCms, destinations_cta_label: e.target.value })}
                    className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                  Action Button URL
                  <input
                    value={homeCms.destinations_cta_href ?? ""}
                    onChange={(e) => setHomeCms({ ...homeCms, destinations_cta_href: e.target.value })}
                    className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  />
                </label>
              </div>
            </div>

            {/* 3. POPULAR TOURS SECTION */}
            <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">3. Popular Tour Packages Explorer</h3>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={homeCms.tours_hidden === true}
                    onChange={(e) => setHomeCms({ ...homeCms, tours_hidden: e.target.checked })}
                    className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 h-4 w-4"
                  />
                  Hide this section on homepage
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                  Eyebrow Badge Text
                  <input
                    value={homeCms.tours_eyebrow ?? ""}
                    onChange={(e) => setHomeCms({ ...homeCms, tours_eyebrow: e.target.value })}
                    className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                  Section Title
                  <input
                    value={homeCms.tours_title ?? ""}
                    onChange={(e) => setHomeCms({ ...homeCms, tours_title: e.target.value })}
                    className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                Section Description
                <textarea
                  rows={2}
                  value={homeCms.tours_description ?? ""}
                  onChange={(e) => setHomeCms({ ...homeCms, tours_description: e.target.value })}
                  className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-slate-100">
                <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                  Action Button Label
                  <input
                    value={homeCms.tours_cta_label ?? ""}
                    onChange={(e) => setHomeCms({ ...homeCms, tours_cta_label: e.target.value })}
                    className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                  Action Button URL
                  <input
                    value={homeCms.tours_cta_href ?? ""}
                    onChange={(e) => setHomeCms({ ...homeCms, tours_cta_href: e.target.value })}
                    className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  />
                </label>
              </div>
            </div>

            {/* 4. WHY US SECTION */}
            <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">4. Why Choose Us (Value Proposition)</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Edit section headings and dynamically add or remove feature cards</p>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={homeCms.why_us_hidden === true}
                      onChange={(e) => setHomeCms({ ...homeCms, why_us_hidden: e.target.checked })}
                      className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 h-4 w-4"
                    />
                    Hide section
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setHomeCms({
                        ...homeCms,
                        why_us_items: [
                          ...(homeCms.why_us_items || []),
                          { icon: "shield", title: "New Reason", description: "Why travelers trust your agency." },
                        ],
                      })
                    }
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition"
                  >
                    + Add Card
                  </button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                  Eyebrow Badge Text
                  <input
                    value={homeCms.why_us_eyebrow ?? ""}
                    onChange={(e) => setHomeCms({ ...homeCms, why_us_eyebrow: e.target.value })}
                    className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                  Section Title
                  <input
                    value={homeCms.why_us_title ?? ""}
                    onChange={(e) => setHomeCms({ ...homeCms, why_us_title: e.target.value })}
                    className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                Section Description
                <textarea
                  rows={2}
                  value={homeCms.why_us_description ?? ""}
                  onChange={(e) => setHomeCms({ ...homeCms, why_us_description: e.target.value })}
                  className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                />
              </label>

              {/* Cards List */}
              <div className="grid gap-3 sm:grid-cols-2 pt-2">
                {(homeCms.why_us_items || []).map((card, idx) => (
                  <div key={idx} className="rounded-lg border border-slate-200 p-4 bg-slate-50/50 space-y-2.5 relative">
                    <div className="flex items-center justify-between gap-2">
                      <select
                        value={card.icon || "shield"}
                        onChange={(e) => {
                          const updated = [...(homeCms.why_us_items || [])];
                          updated[idx] = { ...updated[idx], icon: e.target.value };
                          setHomeCms({ ...homeCms, why_us_items: updated });
                        }}
                        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800 outline-none"
                      >
                        <option value="users">Icon: Users (Local hosts)</option>
                        <option value="receipt">Icon: Receipt (Transparent pricing)</option>
                        <option value="qr">Icon: QR Code (Flexible payment)</option>
                        <option value="ticket">Icon: Ticket (Zero-friction booking)</option>
                        <option value="support">Icon: Support (24/7 human support)</option>
                        <option value="shield">Icon: Shield (Money security)</option>
                        <option value="heart">Icon: Heart (Hospitality)</option>
                        <option value="sparkle">Icon: Sparkle (Special experience)</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = (homeCms.why_us_items || []).filter((_, i) => i !== idx);
                          setHomeCms({ ...homeCms, why_us_items: updated });
                        }}
                        className="text-rose-600 hover:text-rose-800 text-xs font-medium"
                      >
                        Remove
                      </button>
                    </div>
                    <input
                      value={card.title}
                      onChange={(e) => {
                        const updated = [...(homeCms.why_us_items || [])];
                        updated[idx] = { ...updated[idx], title: e.target.value };
                        setHomeCms({ ...homeCms, why_us_items: updated });
                      }}
                      className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-900 outline-none focus:border-emerald-600"
                      placeholder="Card Title"
                    />
                    <textarea
                      rows={2}
                      value={card.description}
                      onChange={(e) => {
                        const updated = [...(homeCms.why_us_items || [])];
                        updated[idx] = { ...updated[idx], description: e.target.value };
                        setHomeCms({ ...homeCms, why_us_items: updated });
                      }}
                      className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700 outline-none focus:border-emerald-600"
                      placeholder="Card Description"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 5. SERVICES SECTION */}
            <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">5. Services Section</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Control trip service categories and custom tour solutions</p>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={homeCms.services_hidden === true}
                      onChange={(e) => setHomeCms({ ...homeCms, services_hidden: e.target.checked })}
                      className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 h-4 w-4"
                    />
                    Hide section
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setHomeCms({
                        ...homeCms,
                        services_items: [
                          ...(homeCms.services_items || []),
                          { icon: "users", title: "New Tour Service", description: "Details of this tour service category." },
                        ],
                      })
                    }
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition"
                  >
                    + Add Service
                  </button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                  Eyebrow Badge Text
                  <input
                    value={homeCms.services_eyebrow ?? ""}
                    onChange={(e) => setHomeCms({ ...homeCms, services_eyebrow: e.target.value })}
                    className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                  Section Title
                  <input
                    value={homeCms.services_title ?? ""}
                    onChange={(e) => setHomeCms({ ...homeCms, services_title: e.target.value })}
                    className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                Section Description
                <textarea
                  rows={2}
                  value={homeCms.services_description ?? ""}
                  onChange={(e) => setHomeCms({ ...homeCms, services_description: e.target.value })}
                  className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                />
              </label>

              {/* Service Cards List */}
              <div className="grid gap-3 sm:grid-cols-2 pt-2">
                {(homeCms.services_items || []).map((srv, idx) => (
                  <div key={idx} className="rounded-lg border border-slate-200 p-4 bg-slate-50/50 space-y-2.5 relative">
                    <div className="flex items-center justify-between gap-2">
                      <select
                        value={srv.icon || "users"}
                        onChange={(e) => {
                          const updated = [...(homeCms.services_items || [])];
                          updated[idx] = { ...updated[idx], icon: e.target.value };
                          setHomeCms({ ...homeCms, services_items: updated });
                        }}
                        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800 outline-none"
                      >
                        <option value="users">Icon: Users (Group tours)</option>
                        <option value="route">Icon: Route (Private trips)</option>
                        <option value="heart">Icon: Heart (Honeymoon)</option>
                        <option value="home">Icon: Home (Family holidays)</option>
                        <option value="briefcase">Icon: Briefcase (Corporate)</option>
                        <option value="mountain">Icon: Mountain (Trekking / Adventure)</option>
                        <option value="compass">Icon: Compass (Exploration)</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = (homeCms.services_items || []).filter((_, i) => i !== idx);
                          setHomeCms({ ...homeCms, services_items: updated });
                        }}
                        className="text-rose-600 hover:text-rose-800 text-xs font-medium"
                      >
                        Remove
                      </button>
                    </div>
                    <input
                      value={srv.title}
                      onChange={(e) => {
                        const updated = [...(homeCms.services_items || [])];
                        updated[idx] = { ...updated[idx], title: e.target.value };
                        setHomeCms({ ...homeCms, services_items: updated });
                      }}
                      className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-900 outline-none focus:border-emerald-600"
                      placeholder="Service Title"
                    />
                    <textarea
                      rows={2}
                      value={srv.description}
                      onChange={(e) => {
                        const updated = [...(homeCms.services_items || [])];
                        updated[idx] = { ...updated[idx], description: e.target.value };
                        setHomeCms({ ...homeCms, services_items: updated });
                      }}
                      className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700 outline-none focus:border-emerald-600"
                      placeholder="Service Description"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 6. SPECIAL OFFERS SECTION */}
            <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">6. Special Offers Banner Section</h3>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={homeCms.offers_hidden === true}
                    onChange={(e) => setHomeCms({ ...homeCms, offers_hidden: e.target.checked })}
                    className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 h-4 w-4"
                  />
                  Hide this section on homepage
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                  Eyebrow Badge Text
                  <input
                    value={homeCms.offers_eyebrow ?? ""}
                    onChange={(e) => setHomeCms({ ...homeCms, offers_eyebrow: e.target.value })}
                    className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                  Section Title
                  <input
                    value={homeCms.offers_title ?? ""}
                    onChange={(e) => setHomeCms({ ...homeCms, offers_title: e.target.value })}
                    className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                Section Description
                <textarea
                  rows={2}
                  value={homeCms.offers_description ?? ""}
                  onChange={(e) => setHomeCms({ ...homeCms, offers_description: e.target.value })}
                  className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                />
              </label>
            </div>

            {/* 7. CUSTOMER REVIEWS SECTION */}
            <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">7. Customer Reviews & Testimonials</h3>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={homeCms.reviews_hidden === true}
                    onChange={(e) => setHomeCms({ ...homeCms, reviews_hidden: e.target.checked })}
                    className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 h-4 w-4"
                  />
                  Hide this section on homepage
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                  Eyebrow Badge Text
                  <input
                    value={homeCms.reviews_eyebrow ?? ""}
                    onChange={(e) => setHomeCms({ ...homeCms, reviews_eyebrow: e.target.value })}
                    className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                  Section Title
                  <input
                    value={homeCms.reviews_title ?? ""}
                    onChange={(e) => setHomeCms({ ...homeCms, reviews_title: e.target.value })}
                    className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                Section Description
                <textarea
                  rows={2}
                  value={homeCms.reviews_description ?? ""}
                  onChange={(e) => setHomeCms({ ...homeCms, reviews_description: e.target.value })}
                  className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                />
              </label>
            </div>

            {/* 8. TRAVEL JOURNAL SECTION */}
            <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">8. Travel Journal & Stories Preview</h3>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={homeCms.journal_hidden === true}
                    onChange={(e) => setHomeCms({ ...homeCms, journal_hidden: e.target.checked })}
                    className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 h-4 w-4"
                  />
                  Hide this section on homepage
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                  Eyebrow Badge Text
                  <input
                    value={homeCms.journal_eyebrow ?? ""}
                    onChange={(e) => setHomeCms({ ...homeCms, journal_eyebrow: e.target.value })}
                    className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                  Section Title
                  <input
                    value={homeCms.journal_title ?? ""}
                    onChange={(e) => setHomeCms({ ...homeCms, journal_title: e.target.value })}
                    className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                Section Description
                <textarea
                  rows={2}
                  value={homeCms.journal_description ?? ""}
                  onChange={(e) => setHomeCms({ ...homeCms, journal_description: e.target.value })}
                  className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-slate-100">
                <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                  Action Button Label
                  <input
                    value={homeCms.journal_cta_label ?? ""}
                    onChange={(e) => setHomeCms({ ...homeCms, journal_cta_label: e.target.value })}
                    className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                  Action Button URL
                  <input
                    value={homeCms.journal_cta_href ?? ""}
                    onChange={(e) => setHomeCms({ ...homeCms, journal_cta_href: e.target.value })}
                    className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  />
                </label>
              </div>
            </div>

            {/* 9. BOTTOM CTA BANNER */}
            <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">9. Bottom Call-To-Action Banner</h3>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={homeCms.cta_hidden === true}
                    onChange={(e) => setHomeCms({ ...homeCms, cta_hidden: e.target.checked })}
                    className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 h-4 w-4"
                  />
                  Hide banner on homepage
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                  Eyebrow Badge Text
                  <input
                    value={homeCms.cta_eyebrow ?? ""}
                    onChange={(e) => setHomeCms({ ...homeCms, cta_eyebrow: e.target.value })}
                    className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                  Banner Headline
                  <input
                    value={homeCms.cta_title ?? ""}
                    onChange={(e) => setHomeCms({ ...homeCms, cta_title: e.target.value })}
                    className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                Banner Description
                <textarea
                  rows={2}
                  value={homeCms.cta_description ?? ""}
                  onChange={(e) => setHomeCms({ ...homeCms, cta_description: e.target.value })}
                  className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-slate-100">
                <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                  Primary Button Label
                  <input
                    value={homeCms.cta_primary_label ?? ""}
                    onChange={(e) => setHomeCms({ ...homeCms, cta_primary_label: e.target.value })}
                    className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                  Primary Button URL
                  <input
                    value={homeCms.cta_primary_href ?? ""}
                    onChange={(e) => setHomeCms({ ...homeCms, cta_primary_href: e.target.value })}
                    className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                  Secondary Button Label
                  <input
                    value={homeCms.cta_secondary_label ?? ""}
                    onChange={(e) => setHomeCms({ ...homeCms, cta_secondary_label: e.target.value })}
                    className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                  Secondary Button URL
                  <input
                    value={homeCms.cta_secondary_href ?? ""}
                    onChange={(e) => setHomeCms({ ...homeCms, cta_secondary_href: e.target.value })}
                    className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  />
                </label>
              </div>
            </div>

            {/* Bottom sticky publish button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSaveCms}
                className="w-full rounded-xl bg-emerald-700 py-3 text-sm font-semibold text-white hover:bg-emerald-800 transition shadow-md"
              >
                Publish All Changes to Homepage
              </button>
            </div>
          </div>
        )}

        {/* ================= ABOUT PAGE CMS TAB ================= */}
        {activeTab === "about_cms" && (
          <div className="max-w-4xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">About Us Page Live Customizer</h2>
                <p className="text-sm text-slate-500">
                  Full control over narrative copy, mission statements, core values, team/hosts, and payment explainer
                </p>
              </div>
              <button
                onClick={handleSaveAboutCms}
                className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800 transition shadow-xs"
              >
                Publish Changes to About Page
              </button>
            </div>

            {/* 1. Hero & Mission Section */}
            <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">1. Hero & Story Narrative</h3>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                  Hero Eyebrow Badge
                  <input
                    value={aboutCms.hero_eyebrow || ""}
                    onChange={(e) => setAboutCms({ ...aboutCms, hero_eyebrow: e.target.value })}
                    className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                  Hero Headline Title
                  <input
                    value={aboutCms.hero_title || ""}
                    onChange={(e) => setAboutCms({ ...aboutCms, hero_title: e.target.value })}
                    className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                Hero Subtitle
                <textarea
                  rows={2}
                  value={aboutCms.hero_subtitle || ""}
                  onChange={(e) => setAboutCms({ ...aboutCms, hero_subtitle: e.target.value })}
                  className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-slate-100">
                <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                  Story Badge Label
                  <input
                    value={aboutCms.story_badge || ""}
                    onChange={(e) => setAboutCms({ ...aboutCms, story_badge: e.target.value })}
                    className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                  Story Section Title
                  <input
                    value={aboutCms.story_title || ""}
                    onChange={(e) => setAboutCms({ ...aboutCms, story_title: e.target.value })}
                    className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                Story Paragraphs (Separate each paragraph with a blank line)
                <textarea
                  rows={6}
                  value={(aboutCms.story_paragraphs || []).join("\n\n")}
                  onChange={(e) =>
                    setAboutCms({
                      ...aboutCms,
                      story_paragraphs: e.target.value.split("\n\n").map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-slate-100">
                <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                  Mission Statement Title
                  <input
                    value={aboutCms.mission_title || ""}
                    onChange={(e) => setAboutCms({ ...aboutCms, mission_title: e.target.value })}
                    className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-700">
                  Mission Statement Copy
                  <textarea
                    rows={2}
                    value={aboutCms.mission_text || ""}
                    onChange={(e) => setAboutCms({ ...aboutCms, mission_text: e.target.value })}
                    className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  />
                </label>
              </div>
            </div>

            {/* 2. Core Values Section */}
            <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">2. Core Values</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Edit, add, or remove company values showcased in the grid</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setAboutCms({
                      ...aboutCms,
                      values: [
                        ...(aboutCms.values || []),
                        { icon: "sparkle", title: "New Value", description: "Value description goes here." },
                      ],
                    })
                  }
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition"
                >
                  + Add Value
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {(aboutCms.values || []).map((val, idx) => (
                  <div key={idx} className="rounded-lg border border-slate-200 p-4 bg-slate-50/50 space-y-2.5 relative">
                    <div className="flex items-center justify-between gap-2">
                      <select
                        value={val.icon || "sparkle"}
                        onChange={(e) => {
                          const updated = [...(aboutCms.values || [])];
                          updated[idx] = { ...updated[idx], icon: e.target.value };
                          setAboutCms({ ...aboutCms, values: updated });
                        }}
                        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800 outline-none"
                      >
                        <option value="shield">Icon: Shield (Security / Transparency)</option>
                        <option value="users">Icon: Users (Local People / Guides)</option>
                        <option value="heart">Icon: Heart (Hospitality / Care)</option>
                        <option value="sparkle">Icon: Sparkle (Considered Detail)</option>
                        <option value="compass">Icon: Compass (Exploration)</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = (aboutCms.values || []).filter((_, i) => i !== idx);
                          setAboutCms({ ...aboutCms, values: updated });
                        }}
                        className="text-rose-600 hover:text-rose-800 text-xs font-medium"
                      >
                        Remove
                      </button>
                    </div>
                    <input
                      value={val.title}
                      onChange={(e) => {
                        const updated = [...(aboutCms.values || [])];
                        updated[idx] = { ...updated[idx], title: e.target.value };
                        setAboutCms({ ...aboutCms, values: updated });
                      }}
                      placeholder="Value title"
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 outline-none focus:border-emerald-600"
                    />
                    <textarea
                      rows={2}
                      value={val.description}
                      onChange={(e) => {
                        const updated = [...(aboutCms.values || [])];
                        updated[idx] = { ...updated[idx], description: e.target.value };
                        setAboutCms({ ...aboutCms, values: updated });
                      }}
                      placeholder="Value description"
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-emerald-600"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Team & Local Hosts Section */}
            <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">3. Team & Local Hosts</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Founders, tour leaders, and on-ground hosts</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setAboutCms({
                      ...aboutCms,
                      team: [
                        ...(aboutCms.team || []),
                        {
                          name: "Host Name",
                          role: "Lead Guide",
                          bio: "Experienced storyteller and expedition leader.",
                          scene: "sajek",
                        },
                      ],
                    })
                  }
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition"
                >
                  + Add Host / Team Member
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
                  Section Eyebrow
                  <input
                    value={aboutCms.team_eyebrow || ""}
                    onChange={(e) => setAboutCms({ ...aboutCms, team_eyebrow: e.target.value })}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-emerald-600"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
                  Section Title
                  <input
                    value={aboutCms.team_title || ""}
                    onChange={(e) => setAboutCms({ ...aboutCms, team_title: e.target.value })}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-emerald-600"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {(aboutCms.team || []).map((member, idx) => (
                  <div key={idx} className="rounded-lg border border-slate-200 p-4 bg-slate-50/50 space-y-2 relative flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-400">Member #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = (aboutCms.team || []).filter((_, i) => i !== idx);
                            setAboutCms({ ...aboutCms, team: updated });
                          }}
                          className="text-rose-600 hover:text-rose-800 text-xs font-medium"
                        >
                          Remove
                        </button>
                      </div>
                      <input
                        value={member.name}
                        onChange={(e) => {
                          const updated = [...(aboutCms.team || [])];
                          updated[idx] = { ...updated[idx], name: e.target.value };
                          setAboutCms({ ...aboutCms, team: updated });
                        }}
                        placeholder="Full Name"
                        className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-900 outline-none focus:border-emerald-600"
                      />
                      <input
                        value={member.role}
                        onChange={(e) => {
                          const updated = [...(aboutCms.team || [])];
                          updated[idx] = { ...updated[idx], role: e.target.value };
                          setAboutCms({ ...aboutCms, team: updated });
                        }}
                        placeholder="Role / Title"
                        className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700 outline-none focus:border-emerald-600"
                      />
                      <input
                        value={member.image_url || ""}
                        onChange={(e) => {
                          const updated = [...(aboutCms.team || [])];
                          updated[idx] = { ...updated[idx], image_url: e.target.value };
                          setAboutCms({ ...aboutCms, team: updated });
                        }}
                        placeholder="Custom Image URL (optional)"
                        className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1 text-[11px] text-slate-600 outline-none focus:border-emerald-600"
                      />
                      <textarea
                        rows={3}
                        value={member.bio}
                        onChange={(e) => {
                          const updated = [...(aboutCms.team || [])];
                          updated[idx] = { ...updated[idx], bio: e.target.value };
                          setAboutCms({ ...aboutCms, team: updated });
                        }}
                        placeholder="Brief bio"
                        className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700 outline-none focus:border-emerald-600"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Payment & QR Clearance Explainer */}
            <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">4. Payment & QR Clearance Section</h3>
                <p className="text-xs text-slate-400 mt-0.5">Explains the transparent partial advance and on-tour QR settlement</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
                  Badge Label
                  <input
                    value={aboutCms.payment_badge || ""}
                    onChange={(e) => setAboutCms({ ...aboutCms, payment_badge: e.target.value })}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
                  Headline Title
                  <input
                    value={aboutCms.payment_title || ""}
                    onChange={(e) => setAboutCms({ ...aboutCms, payment_title: e.target.value })}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600"
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
                Detailed Explainer Text
                <textarea
                  rows={4}
                  value={aboutCms.payment_description || ""}
                  onChange={(e) => setAboutCms({ ...aboutCms, payment_description: e.target.value })}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-slate-100">
                <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
                  Button Label
                  <input
                    value={aboutCms.payment_cta_label || ""}
                    onChange={(e) => setAboutCms({ ...aboutCms, payment_cta_label: e.target.value })}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
                  Button Target Link
                  <input
                    value={aboutCms.payment_cta_href || ""}
                    onChange={(e) => setAboutCms({ ...aboutCms, payment_cta_href: e.target.value })}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600"
                  />
                </label>
              </div>
            </div>

            {/* 5. Bottom Call-To-Action Banner */}
            <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">5. Bottom CTA Banner</h3>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
                  Banner Title
                  <input
                    value={aboutCms.cta_title || ""}
                    onChange={(e) => setAboutCms({ ...aboutCms, cta_title: e.target.value })}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
                  Button Label
                  <input
                    value={aboutCms.cta_label || ""}
                    onChange={(e) => setAboutCms({ ...aboutCms, cta_label: e.target.value })}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
                  Banner Description
                  <textarea
                    rows={2}
                    value={aboutCms.cta_description || ""}
                    onChange={(e) => setAboutCms({ ...aboutCms, cta_description: e.target.value })}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
                  Button Destination URL
                  <input
                    value={aboutCms.cta_href || ""}
                    onChange={(e) => setAboutCms({ ...aboutCms, cta_href: e.target.value })}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600"
                  />
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <button
                  onClick={handleSaveAboutCms}
                  className="w-full rounded-lg bg-emerald-700 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 transition shadow-xs"
                >
                  Publish Changes to About Page
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= BLOG TAB ================= */}
        {activeTab === "blog" && (
          <div className="space-y-6 max-w-5xl">
            {/* Journal Page Header & Settings CMS Card */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Travel Journal Page Header & Settings</h3>
                  <p className="text-xs text-slate-500">Customize the top headline, description, and empty state text shown on /journal</p>
                </div>
                <button
                  onClick={handleSaveJournalCms}
                  className="rounded-lg bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-800 transition shadow-xs"
                >
                  Save Journal Settings
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
                  Page Eyebrow
                  <input
                    value={journalCms.header_eyebrow || ""}
                    onChange={(e) => setJournalCms({ ...journalCms, header_eyebrow: e.target.value })}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
                  Page Headline Title
                  <input
                    value={journalCms.header_title || ""}
                    onChange={(e) => setJournalCms({ ...journalCms, header_title: e.target.value })}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
                  Editorial Subtitle / Description
                  <textarea
                    rows={2}
                    value={journalCms.header_description || ""}
                    onChange={(e) => setJournalCms({ ...journalCms, header_description: e.target.value })}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
                  Featured Story Badge
                  <input
                    value={journalCms.featured_badge || ""}
                    onChange={(e) => setJournalCms({ ...journalCms, featured_badge: e.target.value })}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-slate-100">
                <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
                  Empty State Title
                  <input
                    value={journalCms.empty_title || ""}
                    onChange={(e) => setJournalCms({ ...journalCms, empty_title: e.target.value })}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600"
                  />
                </label>
                <label className="flex flex-col gap-1 text-xs font-medium text-slate-700">
                  Empty State Description
                  <input
                    value={journalCms.empty_description || ""}
                    onChange={(e) => setJournalCms({ ...journalCms, empty_description: e.target.value })}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600"
                  />
                </label>
              </div>
            </div>

            {/* Articles List */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Articles & Editorial Stories ({blogPosts.length})</h2>
                  <p className="text-xs text-slate-500">Draft, publish, and toggle featured articles shown prominently at the top of the Journal</p>
                </div>
                <button
                  onClick={() => setBlogModal({ isOpen: true, post: null })}
                  className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800 transition shadow-xs"
                >
                  + Write Article
                </button>
              </div>

              <div className="space-y-3">
                {blogPosts.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                    No articles written yet. Click &ldquo;+ Write Article&rdquo; above to publish your first story.
                  </div>
                ) : (
                  blogPosts.map((p) => {
                    const isPublished = p.status === "published" || p.is_published === true;
                    const isFeatured = p.is_featured === true;

                    return (
                      <div
                        key={p.id}
                        className="rounded-xl border border-slate-200 bg-white p-5 flex flex-wrap items-center justify-between gap-4 shadow-xs hover:border-slate-300 transition"
                      >
                        <div className="max-w-2xl">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                              {p.category?.name || "Travel"}
                            </span>
                            {isFeatured && (
                              <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-semibold text-amber-800 flex items-center gap-1">
                                ★ Featured Story
                              </span>
                            )}
                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] font-medium border ${
                                isPublished
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-slate-100 text-slate-600 border-slate-200"
                              }`}
                            >
                              {isPublished ? "Published" : "Draft"}
                            </span>
                          </div>
                          <h3 className="font-semibold text-base text-slate-900">{p.title}</h3>
                          {p.excerpt && (
                            <p className="text-xs text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                              {p.excerpt}
                            </p>
                          )}
                          <p className="text-xs text-slate-400 mt-2">
                            Slug: <span className="font-mono text-slate-600">/{p.slug}</span> · Author: {p.author_name || p.author} · {p.read_time_minutes || 5} min read
                          </p>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleToggleBlogFeatured(p)}
                            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                              isFeatured
                                ? "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                            }`}
                            title={isFeatured ? "Unmark from featured" : "Mark as featured story"}
                          >
                            {isFeatured ? "★ Featured" : "☆ Make Featured"}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleBlogStatus(p)}
                            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                              isPublished
                                ? "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            }`}
                          >
                            {isPublished ? "Unpublish" : "Publish"}
                          </button>

                          <button
                            onClick={() => setBlogModal({ isOpen: true, post: p })}
                            className="rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => handleDeleteBlog(p.id)}
                            className="rounded-lg border border-rose-200 bg-rose-50 text-rose-700 px-3.5 py-1.5 text-xs font-medium hover:bg-rose-100 transition"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= OFFERS TAB ================= */}
        {activeTab === "offers" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Promotional Offers & Discounts</h2>
                <p className="text-sm text-slate-500">Manage campaign coupon codes and seasonal discount parameters</p>
              </div>
              <button
                onClick={() => setOfferModal({ isOpen: true, offer: null })}
                className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 transition shadow-xs"
              >
                + Add Promo Offer
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {offers.map((o) => (
                <div key={o.id} className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col justify-between shadow-xs hover:border-slate-300 transition">
                  <div>
                    <span className="font-mono text-xs font-semibold text-slate-900 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md">
                      {o.code || o.slug}
                    </span>
                    <h3 className="font-semibold text-base text-slate-900 mt-3">{o.title}</h3>
                    <p className="text-sm text-slate-600 mt-2">{o.description}</p>
                    <p className="text-xs text-slate-500 mt-3">
                      Valid until: {o.valid_until ? o.valid_until.slice(0, 10) : "Open"}
                    </p>
                  </div>
                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      onClick={() => setOfferModal({ isOpen: true, offer: o })}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteOffer(o.id)}
                      className="rounded-lg border border-rose-200 bg-rose-50 text-rose-700 px-3 py-1.5 text-xs font-medium hover:bg-rose-100 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= REVIEWS TAB ================= */}
        {activeTab === "reviews" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Customer Testimonials</h2>
                <p className="text-sm text-slate-500">Verified traveler reviews and customer feedback showcased on the website</p>
              </div>
              <button
                onClick={() => setReviewModal({ isOpen: true, review: null })}
                className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 transition shadow-xs"
              >
                + Add Testimonial
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((r) => (
                <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col justify-between shadow-xs hover:border-slate-300 transition">
                  <div>
                    <div className="text-amber-500 text-sm mb-2">{"★".repeat(r.rating || 5)}</div>
                    <p className="text-sm text-slate-700 italic">&ldquo;{r.quote}&rdquo;</p>
                    <p className="text-xs font-semibold text-slate-900 mt-3">{r.author_name || r.customer_name}</p>
                    <p className="text-xs text-slate-500">{r.trip_name || r.tour_title || r.author_location}</p>
                  </div>
                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      onClick={() => setReviewModal({ isOpen: true, review: r })}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteReview(r.id)}
                      className="rounded-lg border border-rose-200 bg-rose-50 text-rose-700 px-3 py-1.5 text-xs font-medium hover:bg-rose-100 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= BOOKINGS TAB ================= */}
        {activeTab === "bookings" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Bookings Ledger</h2>
                <p className="text-sm text-slate-500">
                  Customer reservations ledger, payments, balance due on tour day, and clearance tokens
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={bookingStatusFilter}
                  onChange={(e) => setBookingStatusFilter(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                >
                  <option value="all">All Statuses</option>
                  <option value="confirmed_advance_paid">Advance Paid</option>
                  <option value="confirmed_fully_paid">Fully Paid</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="pending_payment">Pending Payment</option>
                  <option value="cleared_on_tour_day">Cleared on Tour Day</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs text-slate-600 uppercase tracking-wider border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="px-4 py-3">Reference</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Tour Details</th>
                    <th className="px-4 py-3">Paid / Total / Due</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Clearance QR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500 text-xs">
                        No customer reservations found matching current criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-4 py-3 font-mono font-medium text-slate-900">{b.reference}</td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">{b.customer_full_name}</div>
                          <div className="text-xs text-slate-500">{b.customer_phone_number}</div>
                          <div className="text-[11px] text-slate-400">{b.customer_email}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">{b.tour_title}</div>
                          <div className="text-xs text-slate-500">
                            {b.traveler_count} traveler(s) · {b.departure_date ? b.departure_date.slice(0, 10) : "Open"}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-emerald-800">{formatBDT(b.amount_paid)} paid</div>
                          <div className="text-xs text-slate-500">Total: {formatBDT(b.total_price)}</div>
                          {Number(b.amount_due) > 0 && (
                            <div className="text-xs text-rose-700 font-medium">Due: {formatBDT(b.amount_due)}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={b.status}
                            onChange={(e) => handleUpdateBookingStatus(b.id, e.target.value)}
                            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-800 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                          >
                            <option value="confirmed_advance_paid">Advance Paid</option>
                            <option value="confirmed_fully_paid">Fully Paid</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="pending_payment">Pending Payment</option>
                            <option value="cleared_on_tour_day">Cleared On Tour Day</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <a
                            href={`/clearance/${b.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 transition"
                          >
                            Pass ↗
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= INQUIRIES TAB ================= */}
        {activeTab === "inquiries" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Customer Leads & Custom Trip Requests</h2>
                <p className="text-sm text-slate-500">Inquiries submitted via the Contact / Plan My Trip consultation forms</p>
              </div>
            </div>

            <div className="space-y-3">
              {inquiries.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500 text-sm shadow-xs">
                  No customer inquiries registered.
                </div>
              ) : (
                inquiries.map((inq) => (
                  <div key={inq.id} className="rounded-xl border border-slate-200 bg-white p-5 flex flex-wrap items-start justify-between gap-4 shadow-xs hover:border-slate-300 transition">
                    <div className="max-w-2xl">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="font-semibold text-base text-slate-900">{inq.name}</span>
                        <span className="text-xs text-slate-500">{inq.phone}</span>
                        {inq.email && <span className="text-xs text-slate-400">· {inq.email}</span>}
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                            inq.status === "resolved"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : inq.status === "in_progress"
                              ? "bg-sky-50 text-sky-700 border-sky-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {inq.status === "in_progress" ? "In Progress" : inq.status === "resolved" ? "Resolved" : "New"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 font-medium">
                        Destination: <span className="text-slate-900">{inq.destination || "Custom"}</span> · Travelers: <span className="text-slate-900">{inq.travelers || "Flexible"}</span> · Trip: <span className="text-slate-900">{inq.trip_type || "General Inquiry"}</span>
                      </p>
                      {inq.message && (
                        <p className="text-sm text-slate-700 mt-2.5 bg-slate-50 p-3 rounded-lg border border-slate-200/80 leading-relaxed">
                          &ldquo;{inq.message}&rdquo;
                        </p>
                      )}
                      {inq.admin_notes && (
                        <p className="text-xs text-slate-500 mt-2 italic">
                          Staff Note: {inq.admin_notes}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => setInquiryModal({ isOpen: true, inquiry: inq })}
                      className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 transition"
                    >
                      Update / Follow-up
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* ================= MODALS ================= */}

      {/* Tour Modal */}
      {tourModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-2xl w-full my-8 max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-5">
              <h3 className="text-base font-semibold text-slate-900">
                {tourModal.tour?.id ? "Edit Tour Package" : "Create Tour Package"}
              </h3>
              <button
                onClick={() => setTourModal({ isOpen: false, tour: null })}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTour} className="space-y-4 text-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-slate-700 text-xs font-medium">
                  Tour Title *
                  <input
                    required
                    name="title"
                    defaultValue={tourModal.tour?.title}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                    placeholder="e.g. Sajek Cloud Escape"
                  />
                </label>
                <label className="flex flex-col gap-1 text-slate-700 text-xs font-medium">
                  URL Slug (optional)
                  <input
                    name="slug"
                    defaultValue={tourModal.tour?.slug}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                    placeholder="e.g. sajek-cloud-escape"
                  />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <label className="flex flex-col gap-1 text-slate-700 text-xs font-medium">
                  Destination *
                  <select
                    name="destination_slug"
                    defaultValue={tourModal.tour?.destination_slug || destinations[0]?.slug}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  >
                    {destinations.length === 0 ? (
                      <option value="bangladesh">General / Bangladesh</option>
                    ) : (
                      destinations.map((d) => (
                        <option key={d.slug} value={d.slug}>{d.name}</option>
                      ))
                    )}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-slate-700 text-xs font-medium">
                  Category *
                  <select
                    name="category"
                    defaultValue={tourModal.tour?.category || "group_tour"}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  >
                    <option value="group_tour">Group Tour</option>
                    <option value="private_tour">Private Tour</option>
                    <option value="honeymoon_package">Honeymoon Package</option>
                    <option value="family_tour">Family Tour</option>
                    <option value="adventure_tour">Adventure Tour</option>
                    <option value="weekend_getaway">Weekend Getaway</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-slate-700 text-xs font-medium">
                  Status *
                  <select
                    name="status"
                    defaultValue={tourModal.tour?.status || "published"}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-4">
                <label className="flex flex-col gap-1 text-slate-700 text-xs font-medium">
                  Days *
                  <input
                    type="number"
                    name="duration_days"
                    defaultValue={tourModal.tour?.duration_days || 3}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  />
                </label>
                <label className="flex flex-col gap-1 text-slate-700 text-xs font-medium">
                  Nights *
                  <input
                    type="number"
                    name="duration_nights"
                    defaultValue={tourModal.tour?.duration_nights || 2}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  />
                </label>
                <label className="flex flex-col gap-1 text-slate-700 text-xs font-medium">
                  Base Price (৳) *
                  <input
                    required
                    type="number"
                    name="base_price"
                    defaultValue={tourModal.tour?.base_price || 25000}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  />
                </label>
                <label className="flex flex-col gap-1 text-slate-700 text-xs font-medium">
                  Discount (৳)
                  <input
                    type="number"
                    name="discount_value"
                    defaultValue={tourModal.tour?.discount_value || 0}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-slate-700 text-xs font-medium">
                  Advance Deposit Required (%) *
                  <input
                    type="number"
                    name="advance_payment_percent"
                    defaultValue={tourModal.tour?.advance_payment_percent || 40}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  />
                </label>
                <label className="flex flex-col gap-1 text-slate-700 text-xs font-medium">
                  Total Seats per Departure
                  <input
                    type="number"
                    name="total_seats"
                    defaultValue={tourModal.tour?.total_seats || 14}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-slate-700 text-xs font-medium">
                  Meeting Point
                  <input
                    name="meeting_point"
                    defaultValue={tourModal.tour?.meeting_point || "Dhaka Sayedabad / Fakirapool"}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  />
                </label>
                <label className="flex flex-col gap-1 text-slate-700 text-xs font-medium">
                  Departure Schedule
                  <input
                    name="departure_schedule"
                    defaultValue={tourModal.tour?.departure_schedule || "Every Thursday night"}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1 text-slate-700 text-xs font-medium">
                Cover Photo URL
                <input
                  name="hero_image"
                  defaultValue={tourModal.tour?.hero_image || ""}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  placeholder="https://images.unsplash.com/..."
                />
              </label>

              <label className="flex flex-col gap-1 text-slate-700 text-xs font-medium">
                Short Description
                <textarea
                  required
                  rows={2}
                  name="short_description"
                  defaultValue={tourModal.tour?.short_description}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                />
              </label>

              <label className="flex flex-col gap-1 text-slate-700 text-xs font-medium">
                Detailed Overview
                <textarea
                  rows={4}
                  name="full_description"
                  defaultValue={tourModal.tour?.full_description}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-slate-700 text-xs font-medium">
                  Inclusions (comma-separated)
                  <input
                    name="inclusions"
                    defaultValue={tourModal.tour?.inclusions?.join(", ") || "AC Bus, Cottage stay, 3 meals daily, Guide fee"}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  />
                </label>
                <label className="flex flex-col gap-1 text-slate-700 text-xs font-medium">
                  Exclusions (comma-separated)
                  <input
                    name="exclusions"
                    defaultValue={tourModal.tour?.exclusions?.join(", ") || "Personal expenses, Tips"}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  />
                </label>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    name="allow_partial_payment"
                    defaultChecked={tourModal.tour?.allow_partial_payment ?? true}
                    className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
                  />
                  Allow Partial Advance Payment
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_featured"
                    defaultChecked={tourModal.tour?.is_featured ?? true}
                    className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
                  />
                  Feature on Homepage
                </label>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTourModal({ isOpen: false, tour: null })}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-700 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-800 transition shadow-xs"
                >
                  Save Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Destination Modal */}
      {destModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-2xl w-full my-8 max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-5">
              <h3 className="text-base font-semibold text-slate-900">
                {destModal.destination?.id ? "Edit Destination" : "Create Destination"}
              </h3>
              <button onClick={() => setDestModal({ isOpen: false, destination: null })} className="text-slate-400 hover:text-slate-600 text-lg leading-none">✕</button>
            </div>

            <form onSubmit={handleSaveDestination} className="space-y-4 text-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-slate-700 text-xs font-medium">
                  Destination Name *
                  <input
                    required
                    name="name"
                    defaultValue={destModal.destination?.name}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                    placeholder="e.g. Saint Martin's Island"
                  />
                </label>
                <label className="flex flex-col gap-1 text-slate-700 text-xs font-medium">
                  Division *
                  <select
                    name="division"
                    defaultValue={destModal.destination?.division || "chattogram"}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  >
                    <option value="chattogram">Chattogram</option>
                    <option value="sylhet">Sylhet</option>
                    <option value="khulna">Khulna</option>
                    <option value="dhaka">Dhaka</option>
                    <option value="barishal">Barishal</option>
                    <option value="rajshahi">Rajshahi</option>
                  </select>
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-slate-700 text-xs font-medium">
                  Tagline
                  <input
                    name="tagline"
                    defaultValue={destModal.destination?.tagline}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                    placeholder="e.g. Bangladesh's only coral island"
                  />
                </label>
                <label className="flex flex-col gap-1 text-slate-700 text-xs font-medium">
                  Best Time to Visit
                  <input
                    name="best_time_to_visit"
                    defaultValue={destModal.destination?.best_time_to_visit || "November to March"}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1 text-slate-700 text-xs font-medium">
                Description
                <textarea
                  required
                  rows={3}
                  name="description"
                  defaultValue={destModal.destination?.description}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                />
              </label>

              <label className="flex flex-col gap-1 text-slate-700 text-xs font-medium">
                Popular Attractions (comma-separated)
                <input
                  name="popular_attractions"
                  defaultValue={destModal.destination?.popular_attractions?.join(", ")}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  placeholder="Chera Dwip, West Beach, Coral Reefs"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-slate-700 text-xs font-medium">
                  Cover Photo URL
                  <input
                    name="cover_image"
                    defaultValue={destModal.destination?.cover_image || ""}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                    placeholder="https://..."
                  />
                </label>
                <label className="flex flex-col gap-1 text-slate-700 text-xs font-medium">
                  Recommended Lodging
                  <input
                    name="recommended_accommodation"
                    defaultValue={destModal.destination?.recommended_accommodation || "Eco Beach Resort"}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1 text-slate-700 text-xs font-medium">
                Travel Guidelines & Tips
                <textarea
                  rows={2}
                  name="travel_tips"
                  defaultValue={destModal.destination?.travel_tips}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  placeholder="Book ship tickets 3 days ahead in peak winter."
                />
              </label>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_featured"
                    defaultChecked={destModal.destination?.is_featured ?? true}
                    className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
                  />
                  Featured Destination
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-600">
                  Status:
                  <select
                    name="status"
                    defaultValue={destModal.destination?.status || "published"}
                    className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 shadow-xs"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </label>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDestModal({ isOpen: false, destination: null })}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-700 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-800 transition shadow-xs"
                >
                  Save Destination
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Blog Modal */}
      {blogModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-2xl w-full my-8 max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-5">
              <h3 className="text-base font-semibold text-slate-900">
                {blogModal.post?.id ? "Edit Journal Article" : "Write Journal Article"}
              </h3>
              <button onClick={() => setBlogModal({ isOpen: false, post: null })} className="text-slate-400 hover:text-slate-600 text-lg leading-none">✕</button>
            </div>

            <form onSubmit={handleSaveBlog} className="space-y-4 text-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-slate-700 text-xs font-medium">
                  Article Title *
                  <input
                    required
                    name="title"
                    defaultValue={blogModal.post?.title}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  />
                </label>
                <label className="flex flex-col gap-1 text-slate-700 text-xs font-medium">
                  URL Slug
                  <input
                    name="slug"
                    defaultValue={blogModal.post?.slug}
                    placeholder="e.g. sajek-travel-guide (auto-generated if empty)"
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs font-mono"
                  />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-slate-700 text-xs font-medium">
                  Author *
                  <input
                    required
                    name="author"
                    defaultValue={blogModal.post?.author_name || blogModal.post?.author || "Atithi Editorial Team"}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  />
                </label>
                <label className="flex flex-col gap-1 text-slate-700 text-xs font-medium">
                  Category *
                  <input
                    name="category"
                    defaultValue={blogModal.post?.category?.name || "Travel Guide"}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-slate-700 text-xs font-medium">
                  Cover Image URL
                  <input
                    name="hero_image"
                    defaultValue={blogModal.post?.cover_image || blogModal.post?.hero_image || ""}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  />
                </label>
                <label className="flex flex-col gap-1 text-slate-700 text-xs font-medium">
                  Estimated Read Time (minutes)
                  <input
                    type="number"
                    name="read_time_minutes"
                    defaultValue={blogModal.post?.read_time_minutes || 5}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1 text-slate-700 text-xs font-medium">
                Article Excerpt / Preview Summary
                <textarea
                  rows={2}
                  name="excerpt"
                  defaultValue={blogModal.post?.excerpt}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  placeholder="Short summary displayed on cards and search results..."
                />
              </label>

              <label className="flex flex-col gap-1 text-slate-700 text-xs font-medium">
                Article Body (Markdown supported)
                <textarea
                  required
                  rows={8}
                  name="content"
                  defaultValue={blogModal.post?.body || blogModal.post?.content}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs font-mono"
                  placeholder="Write body content here…"
                />
              </label>

              <label className="flex flex-col gap-1 text-slate-700 text-xs font-medium">
                Tags (comma-separated)
                <input
                  name="tags"
                  defaultValue={blogModal.post?.tags?.join(", ") || "Bangladesh, Travel, Guide"}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                />
              </label>

              <div className="flex flex-wrap items-center gap-6 pt-2">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_published"
                    defaultChecked={blogModal.post?.status === "published" || blogModal.post?.is_published === true}
                    className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
                  />
                  Publish Immediately
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_featured"
                    defaultChecked={blogModal.post?.is_featured === true}
                    className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                  />
                  Feature this Story (Hero display on Travel Journal)
                </label>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setBlogModal({ isOpen: false, post: null })}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-700 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-800 transition shadow-xs"
                >
                  Save Article
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Offer Modal */}
      {offerModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-base font-semibold text-slate-900 mb-4">
              {offerModal.offer?.id ? "Edit Special Offer" : "Create Special Offer"}
            </h3>
            <form onSubmit={handleSaveOffer} className="space-y-3.5 text-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-slate-700 text-xs font-medium">
                  Promo Code *
                  <input
                    required
                    name="code"
                    defaultValue={offerModal.offer?.code || offerModal.offer?.slug}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 uppercase font-mono outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                    placeholder="WINTER20"
                  />
                </label>
                <label className="flex flex-col gap-1 text-slate-700 text-xs font-medium">
                  Discount Type
                  <select
                    name="discount_type"
                    defaultValue={offerModal.offer?.discount_type || "percent"}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  >
                    <option value="percent">Percentage (%)</option>
                    <option value="flat">Flat Amount (৳)</option>
                  </select>
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-slate-700 text-xs font-medium">
                  Discount Value *
                  <input
                    required
                    type="number"
                    name="discount_value"
                    defaultValue={offerModal.offer?.discount_value || 15}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  />
                </label>
                <label className="flex flex-col gap-1 text-slate-700 text-xs font-medium">
                  Minimum Spend (৳)
                  <input
                    type="number"
                    name="minimum_spend"
                    defaultValue={offerModal.offer?.minimum_spend || 0}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1 text-slate-700 text-xs font-medium">
                Campaign Title *
                <input
                  required
                  name="title"
                  defaultValue={offerModal.offer?.title}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  placeholder="e.g. Winter Holiday Special"
                />
              </label>

              <label className="flex flex-col gap-1 text-slate-700 text-xs font-medium">
                Description
                <textarea
                  rows={2}
                  name="description"
                  defaultValue={offerModal.offer?.description}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-slate-700 text-xs font-medium">
                  Valid From
                  <input
                    type="date"
                    name="valid_from"
                    defaultValue={offerModal.offer?.valid_from ? offerModal.offer.valid_from.slice(0, 10) : ""}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none shadow-xs"
                  />
                </label>
                <label className="flex flex-col gap-1 text-slate-700 text-xs font-medium">
                  Valid Until
                  <input
                    type="date"
                    name="valid_until"
                    defaultValue={offerModal.offer?.valid_until ? offerModal.offer.valid_until.slice(0, 10) : ""}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none shadow-xs"
                  />
                </label>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_active"
                    defaultChecked={offerModal.offer?.is_active ?? true}
                    className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
                  />
                  Active & Redeemable
                </label>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setOfferModal({ isOpen: false, offer: null })}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-700 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-800 transition shadow-xs"
                >
                  Save Offer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Testimonial Modal */}
      {reviewModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-base font-semibold text-slate-900 mb-4">
              {reviewModal.review?.id ? "Edit Testimonial" : "Add Customer Testimonial"}
            </h3>
            <form onSubmit={handleSaveReview} className="space-y-3.5 text-sm">
              <label className="flex flex-col gap-1 text-slate-700 text-xs font-medium">
                Customer Full Name *
                <input
                  required
                  name="author_name"
                  defaultValue={reviewModal.review?.author_name || reviewModal.review?.customer_name}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  placeholder="Farzana Islam"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-slate-700 text-xs font-medium">
                  Location
                  <input
                    name="author_location"
                    defaultValue={reviewModal.review?.author_location || "Dhaka"}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  />
                </label>
                <label className="flex flex-col gap-1 text-slate-700 text-xs font-medium">
                  Star Rating (1-5) *
                  <select
                    name="rating"
                    defaultValue={reviewModal.review?.rating || 5}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  >
                    <option value={5}>5 Stars (Exceptional)</option>
                    <option value={4}>4 Stars (Very Good)</option>
                    <option value={3}>3 Stars (Average)</option>
                  </select>
                </label>
              </div>

              <label className="flex flex-col gap-1 text-slate-700 text-xs font-medium">
                Tour Package Taken *
                <input
                  required
                  name="trip_name"
                  defaultValue={reviewModal.review?.trip_name || reviewModal.review?.tour_title || "Sajek Valley Experience"}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                />
              </label>

              <label className="flex flex-col gap-1 text-slate-700 text-xs font-medium">
                Customer Testimonial Quote *
                <textarea
                  required
                  rows={3}
                  name="quote"
                  defaultValue={reviewModal.review?.quote}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  placeholder="The tour host was attentive and punctual throughout the trip."
                />
              </label>

              <div className="flex items-center gap-2 pt-2">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_featured"
                    defaultChecked={reviewModal.review?.is_featured ?? true}
                    className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
                  />
                  Feature on Homepage Showcase
                </label>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReviewModal({ isOpen: false, review: null })}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-700 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-800 transition shadow-xs"
                >
                  Save Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inquiry Detail & Response Modal */}
      {inquiryModal.isOpen && inquiryModal.inquiry && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full shadow-xl">
            <h3 className="text-base font-semibold text-slate-900 mb-1">Customer Lead Follow-up</h3>
            <p className="text-xs text-slate-500 mb-4">
              Inquiry from <span className="font-medium text-slate-800">{inquiryModal.inquiry.name}</span> ({inquiryModal.inquiry.phone})
            </p>

            <form onSubmit={handleSaveInquiry} className="space-y-4 text-sm">
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs text-slate-700 space-y-1.5">
                <div><strong className="text-slate-900">Destination:</strong> {inquiryModal.inquiry.destination || "Custom"}</div>
                <div><strong className="text-slate-900">Travelers:</strong> {inquiryModal.inquiry.travelers || "Flexible"}</div>
                <div><strong className="text-slate-900">Message:</strong> &ldquo;{inquiryModal.inquiry.message}&rdquo;</div>
              </div>

              <label className="flex flex-col gap-1 text-slate-700 text-xs font-medium">
                Inquiry Lifecycle Status
                <select
                  name="status"
                  defaultValue={inquiryModal.inquiry.status}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                >
                  <option value="new">New (Uncontacted)</option>
                  <option value="in_progress">In Progress / Contacted</option>
                  <option value="resolved">Resolved / Quote Sent</option>
                </select>
              </label>

              <label className="flex flex-col gap-1 text-slate-700 text-xs font-medium">
                Internal Staff Follow-up Notes
                <textarea
                  rows={3}
                  name="admin_notes"
                  defaultValue={inquiryModal.inquiry.admin_notes || ""}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                  placeholder="e.g. Contacted customer via phone at 3:30 PM. Provided itinerary details."
                />
              </label>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setInquiryModal({ isOpen: false, inquiry: null })}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-700 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-800 transition shadow-xs"
                >
                  Update Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
