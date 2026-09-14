import type { Destination, Faq, HomepageBlock, HomepageBlockType, ItineraryDay, JournalPost, Offer, Review, Scene, Tour } from "@/lib/types";
import { scenes } from "@/lib/scenes";
import * as db from "@/server/db";

/**
 * Live data client for the Atithi backend (supports both native Next.js
 * backend and external API endpoints).
 *
 * Every fetch here is wrapped so an unreachable external backend never breaks
 * a build or a page render — callers fall back to the embedded database
 * engine in `src/server/db.ts` (and bundled static data in `src/data/*`).
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

async function apiFetch<T>(path: string, revalidateSeconds: number = 300): Promise<T | null> {
  try {
    // Only attempt external HTTP fetch if API_BASE is an absolute URL
    if (!API_BASE.startsWith("http://") && !API_BASE.startsWith("https://")) {
      return null;
    }
    const res = await fetch(`${API_BASE}${path}`, {
      next: { revalidate: revalidateSeconds },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    // Backend unreachable (offline build, backend not deployed yet, etc).
    return null;
  }
}

// A destination/tour's "scene" is a purely visual, procedurally-rendered
// backdrop (see src/lib/scenes.ts) — the backend has no equivalent field,
// so we map a slug to the closest existing scene key, falling back to a
// neutral default rather than leaving the page unstyled.
const SCENE_KEYS = Object.keys(scenes) as Array<keyof typeof scenes>;
function sceneForSlug(slug: string, label: string, imageUrl?: string | null, videoUrl?: string | null): Scene {
  const normalized = slug.replace(/-/g, "");
  const match = SCENE_KEYS.find((key) => normalized.includes(key) || key.includes(normalized));
  return {
    key: (match ?? "dhaka") as Scene["key"],
    label,
    imageUrl: imageUrl ?? undefined,
    videoUrl: videoUrl ?? undefined,
  };
}

// ---------------------------------------------------------------------------
// Destinations
// ---------------------------------------------------------------------------

interface ApiDestinationListItem {
  id: string;
  name: string;
  slug: string;
  division: string;
  cover_image: string | null;
  is_featured: boolean;
  status: string;
}

interface ApiDestinationDetail extends ApiDestinationListItem {
  description: string;
  best_time_to_visit: string;
  weather_notes: string;
  popular_attractions: string[];
  recommended_accommodation: string;
  travel_tips: string;
  permits_required: string;
  cover_video_url: string;
  seo_title: string;
  seo_description: string;
  gallery: { id: string; image: string; caption: string }[];
}

function divisionLabel(division: string): string {
  return `${division.charAt(0).toUpperCase()}${division.slice(1)} Division`;
}

function adaptDestination(d: ApiDestinationDetail, tourSlugs: string[]): Destination {
  return {
    slug: d.slug,
    name: d.name,
    bn: "",
    tagline: d.seo_description || d.description.slice(0, 90),
    region: divisionLabel(d.division),
    description: d.description,
    cover: sceneForSlug(d.slug, d.name, d.cover_image, d.cover_video_url),
    gallery: d.gallery.length
      ? d.gallery.map((g) => sceneForSlug(d.slug, g.caption || d.name, g.image))
      : [sceneForSlug(d.slug, d.name, d.cover_image, d.cover_video_url)],
    bestTime: d.best_time_to_visit,
    weather: d.weather_notes,
    attractions: d.popular_attractions,
    accommodation: d.recommended_accommodation,
    travelTips: d.travel_tips ? d.travel_tips.split("\n").filter(Boolean) : [],
    tourSlugs,
  };
}

export async function fetchDestinations(): Promise<Destination[] | null> {
  try {
    const list = await apiFetch<{ results: ApiDestinationListItem[] }>("/destinations/");
    if (list && list.results.length > 0) {
      const detailed = await Promise.all(
        list.results.map(async (item) => {
          const detail = await apiFetch<ApiDestinationDetail>(`/destinations/${item.slug}/`);
          if (!detail) return null;
          const tourList = await apiFetch<{ results: { slug: string }[] }>(
            `/tours/?destination__slug=${item.slug}`
          );
          return adaptDestination(detail, (tourList?.results ?? []).map((t) => t.slug));
        })
      );
      const filtered = detailed.filter((d): d is Destination => d !== null);
      if (filtered.length > 0) return filtered;
    }
  } catch {
    // Fall back to native db below
  }

  try {
    const list = db.getDestinations();
    return list.map((d) => {
      const tourSlugs = db.getTours(d.slug).map((t) => t.slug);
      return adaptDestination(d, tourSlugs);
    });
  } catch {
    return null;
  }
}

export async function fetchDestination(slug: string): Promise<Destination | null> {
  try {
    const detail = await apiFetch<ApiDestinationDetail>(`/destinations/${slug}/`);
    if (detail) {
      const tourList = await apiFetch<{ results: { slug: string }[] }>(`/tours/?destination__slug=${slug}`);
      return adaptDestination(detail, (tourList?.results ?? []).map((t) => t.slug));
    }
  } catch {
    // Fall back to native db below
  }

  try {
    const d = db.getDestinationBySlug(slug);
    if (!d) return null;
    const tourSlugs = db.getTours(slug).map((t) => t.slug);
    return adaptDestination(d, tourSlugs);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Tours
// ---------------------------------------------------------------------------

interface ApiTourListItem {
  id: string;
  title: string;
  slug: string;
  destination: string;
  destination_name: string;
  category: string;
  short_description: string;
  hero_image: string | null;
  duration_days: number;
  duration_nights: number;
  base_price: string;
  final_price: string;
  is_featured: boolean;
  status: string;
}

interface ApiTourDetail {
  id: string;
  title: string;
  slug: string;
  destination: { slug: string; name: string };
  category: string;
  short_description: string;
  full_description: string;
  hero_image: string | null;
  duration_days: number;
  duration_nights: number;
  base_price: string;
  discount_type: string;
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
  departures: { id: string; departure_date: string; seats_remaining: number; is_active: boolean }[];
  itinerary: { day_number: number; title: string; description: string }[];
  gallery: { id: string; image: string; caption: string }[];
  faqs: { question: string; answer: string }[];
  is_featured: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  group: "Group Tour",
  group_tour: "Group Tour",
  private: "Private Tour",
  private_tour: "Private Tour",
  family: "Family Tour",
  family_tour: "Family Tour",
  honeymoon: "Honeymoon Package",
  honeymoon_package: "Honeymoon Package",
  corporate: "Corporate Retreat",
  corporate_retreat: "Corporate Retreat",
  educational: "Educational Tour",
  educational_tour: "Educational Tour",
  adventure: "Adventure Tour",
  adventure_tour: "Adventure Tour",
  weekend: "Weekend Getaway",
  weekend_getaway: "Weekend Getaway",
  luxury: "Luxury Domestic Tour",
  luxury_domestic_tour: "Luxury Domestic Tour",
};

function adaptTourListItem(t: ApiTourListItem): Tour {
  return {
    slug: t.slug,
    title: t.title,
    destinationSlug: t.destination ? t.destination : (t.destination_name ? slugifyFallback(t.destination_name) : ""),
    duration: `${t.duration_days} Day${t.duration_days === 1 ? "" : "s"} / ${t.duration_nights} Night${t.duration_nights === 1 ? "" : "s"}`,
    startingPrice: Math.round(parseFloat(t.base_price)),
    discount: Math.max(0, Math.round(parseFloat(t.base_price) - parseFloat(t.final_price))),
    advancePercent: 40,
    category: CATEGORY_LABELS[t.category] ?? t.category,
    summary: t.short_description,
    description: t.short_description,
    cover: sceneForSlug(t.slug, t.title, t.hero_image),
    gallery: [sceneForSlug(t.slug, t.title, t.hero_image)],
    itinerary: [],
    inclusions: [],
    exclusions: [],
    accommodation: "",
    transportation: "",
    meals: "",
    capacity: 0,
    departure: "",
    meetingPoint: "",
    faqs: [],
    featured: t.is_featured,
  };
}

function adaptTourDetail(t: ApiTourDetail): Tour {
  const itinerary: ItineraryDay[] = t.itinerary.map((d) => ({
    day: d.day_number,
    title: d.title,
    description: d.description,
  }));
  const faqs: Faq[] = t.faqs.map((f) => ({ question: f.question, answer: f.answer }));

  return {
    id: t.id,
    slug: t.slug,
    title: t.title,
    destinationSlug: t.destination.slug,
    duration: `${t.duration_days} Day${t.duration_days === 1 ? "" : "s"} / ${t.duration_nights} Night${t.duration_nights === 1 ? "" : "s"}`,
    startingPrice: Math.round(parseFloat(t.base_price)),
    discount: Math.max(0, Math.round(parseFloat(t.base_price) - parseFloat(t.final_price))),
    advancePercent: Math.round(parseFloat(t.advance_payment_percent)),
    allowPartialPayment: t.allow_partial_payment,
    category: CATEGORY_LABELS[t.category] ?? t.category,
    summary: t.short_description,
    description: t.full_description || t.short_description,
    cover: sceneForSlug(t.slug, t.title, t.hero_image),
    gallery: t.gallery.length
      ? t.gallery.map((g) => sceneForSlug(t.slug, g.caption || t.title, g.image))
      : [sceneForSlug(t.slug, t.title, t.hero_image)],
    itinerary,
    inclusions: t.inclusions,
    exclusions: t.exclusions,
    accommodation: t.accommodation_notes,
    transportation: t.transportation_notes,
    meals: t.meals_notes,
    capacity: t.total_seats,
    departure: t.departure_schedule,
    departures: t.departures
      .filter((d) => d.is_active)
      .map((d) => ({ id: d.id, date: d.departure_date, seatsRemaining: d.seats_remaining })),
    meetingPoint: t.meeting_point,
    faqs,
    featured: t.is_featured,
  };
}

function slugifyFallback(name: string): string {
  return name
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function fetchTours(): Promise<Tour[] | null> {
  try {
    const list = await apiFetch<{ results: ApiTourListItem[] }>("/tours/");
    if (list && list.results.length > 0) {
      return list.results.map(adaptTourListItem);
    }
  } catch {
    // Fall back to native db below
  }

  try {
    const list = db.getTours();
    return list.map((t) =>
      adaptTourListItem({
        ...t,
        destination: t.destination_slug,
      })
    );
  } catch {
    return null;
  }
}

export async function fetchTour(slug: string): Promise<Tour | null> {
  try {
    const detail = await apiFetch<ApiTourDetail>(`/tours/${slug}/`, 0);
    if (detail) {
      return adaptTourDetail(detail);
    }
  } catch {
    // Fall back to native db below
  }

  try {
    const t = db.getTourBySlug(slug);
    if (!t) return null;
    return adaptTourDetail({
      ...t,
      destination: { slug: t.destination_slug, name: t.destination_name },
    });
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// CMS: offers, testimonials, blog / journal
// ---------------------------------------------------------------------------

interface ApiOffer {
  title: string;
  description: string;
  slug: string;
  tour_slug: string | null;
  valid_until: string;
  banner_image: string | null;
}

export async function fetchOffers(): Promise<Offer[] | null> {
  try {
    const list = await apiFetch<{ results: ApiOffer[] }>("/offers/");
    if (list && list.results.length > 0) {
      return list.results.map((o) => ({
        title: o.title,
        description: o.description,
        code: o.slug.toUpperCase(),
        badge: "Limited Time",
        expiry: new Date(o.valid_until).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
        bannerUrl: o.banner_image ?? undefined,
      }));
    }
  } catch {
    // Fall back to native db below
  }

  try {
    const list = db.getOffers();
    return list.map((o) => ({
      title: o.title,
      description: o.description,
      code: o.slug.toUpperCase(),
      badge: "Limited Time",
      expiry: new Date(o.valid_until).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
      bannerUrl: o.banner_image ?? undefined,
    }));
  } catch {
    return null;
  }
}

interface ApiTestimonial {
  customer_name: string;
  tour_title: string;
  rating: number;
  quote: string;
  customer_photo: string | null;
}

export async function fetchTestimonials(): Promise<Review[] | null> {
  try {
    const list = await apiFetch<{ results: ApiTestimonial[] }>("/testimonials/?is_featured=true");
    if (list && list.results.length > 0) {
      return list.results.map((r) => ({
        name: r.customer_name,
        location: "",
        tour: r.tour_title,
        rating: r.rating,
        text: r.quote,
        photoUrl: r.customer_photo ?? undefined,
      }));
    }
  } catch {
    // Fall back to native db below
  }

  try {
    const list = db.getTestimonials(true);
    return list.map((r) => ({
      name: r.customer_name,
      location: "",
      tour: r.tour_title,
      rating: r.rating,
      text: r.quote,
      photoUrl: r.customer_photo ?? undefined,
    }));
  } catch {
    return null;
  }
}

interface ApiBlogPostListItem {
  slug: string;
  title: string;
  category: { name: string } | null;
  author_name: string;
  cover_image: string | null;
  excerpt: string;
  published_at: string | null;
}

interface ApiBlogPostDetail extends ApiBlogPostListItem {
  body: string;
}

function adaptJournalListItem(p: ApiBlogPostListItem): JournalPost {
  return {
    slug: p.slug,
    title: p.title,
    category: p.category?.name ?? "Travel Tips",
    excerpt: p.excerpt,
    date: p.published_at
      ? new Date(p.published_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
      : "",
    author: p.author_name || "Atithi Editorial",
    readTime: "4 min read",
    cover: sceneForSlug(p.slug, p.title, p.cover_image),
    body: [],
  };
}

export async function fetchJournalPosts(): Promise<JournalPost[] | null> {
  try {
    const list = await apiFetch<{ results: ApiBlogPostListItem[] }>("/blog-posts/");
    if (list && list.results.length > 0) {
      return list.results.map(adaptJournalListItem);
    }
  } catch {
    // Fall back to native db below
  }

  try {
    const list = db.getBlogPosts();
    return list.map(adaptJournalListItem);
  } catch {
    return null;
  }
}

export async function fetchJournalPost(slug: string): Promise<JournalPost | null> {
  try {
    const post = await apiFetch<ApiBlogPostDetail>(`/blog-posts/${slug}/`);
    if (post) {
      return {
        ...adaptJournalListItem(post),
        body: post.body ? [{ paragraphs: post.body.split("\n\n").filter(Boolean) }] : [],
      };
    }
  } catch {
    // Fall back to native db below
  }

  try {
    const post = db.getBlogPostBySlug(slug);
    if (!post) return null;
    return {
      ...adaptJournalListItem(post),
      body: post.body ? [{ paragraphs: post.body.split("\n\n").filter(Boolean) }] : [],
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Homepage blocks (admin-editable page-builder content — Plan Section 21)
// ---------------------------------------------------------------------------

interface ApiHomepageBlock {
  id: string;
  block_type: HomepageBlockType;
  display_order: number;
  content: Record<string, unknown>;
}

export async function fetchHomepageBlocks(): Promise<HomepageBlock[] | null> {
  try {
    const list = await apiFetch<ApiHomepageBlock[]>("/homepage-blocks/");
    if (list && list.length > 0) {
      return list
        .map((b) => ({
          id: b.id,
          blockType: b.block_type,
          displayOrder: b.display_order,
          content: b.content ?? {},
        }))
        .sort((a, b) => a.displayOrder - b.displayOrder);
    }
  } catch {
    // Fall back to native db below
  }

  try {
    const list = db.getHomepageBlocks();
    return list
      .map((b) => ({
        id: b.id,
        blockType: b.block_type,
        displayOrder: b.display_order,
        content: b.content ?? {},
      }))
      .sort((a, b) => a.displayOrder - b.displayOrder);
  } catch {
    return null;
  }
}
