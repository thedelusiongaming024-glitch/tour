import type { Review, Service, Offer } from "@/lib/types";

export const siteName = "ATITHI";
export const siteNameBn = "অতিথি";
export const siteTagline = "Discover Bangladesh, your way";
export const siteDescription =
  "Curated domestic tours across Bangladesh. Trusted local hosts, transparent pricing, and complete financial clarity from booking to on-site payment clearance.";

export const heroStats: { value: string; label: string }[] = [];

export const whyUs: { title: string; description: string; icon: string }[] = [
  {
    title: "Trusted local hosts",
    description:
      "Every tour is led by a verified Bangladeshi host who knows their district like family — not a scripted guide.",
    icon: "users",
  },
  {
    title: "Transparent pricing",
    description:
      "The price you see is the price you pay. No hidden fees, no last-minute 'fuel surcharges', no surprises.",
    icon: "receipt",
  },
  {
    title: "Flexible payment",
    description:
      "Book with a 40% advance and clear the balance on tour day — by QR scan or online, with confirmation to both sides.",
    icon: "qr",
  },
  {
    title: "Zero-friction booking",
    description:
      "From browsing to e-ticket in minutes. Your voucher, QR ticket, and reminders arrive automatically on WhatsApp and email.",
    icon: "ticket",
  },
  {
    title: "Real 24/7 support",
    description:
      "A human answers on WhatsApp throughout your trip — not a chatbot that loops you in circles.",
    icon: "support",
  },
  {
    title: "Money, fully accounted",
    description:
      "Every payment is tracked end-to-end and confirmed to you and our team, so there's never a dispute about what was paid.",
    icon: "shield",
  },
];

export const services: Service[] = [
  {
    title: "Group Tours",
    description:
      "Curated group departures to every corner of Bangladesh, led by a local host and priced all-inclusive.",
    icon: "users",
  },
  {
    title: "Private & Custom Trips",
    description:
      "Your dates, your pace, your budget. We design a private itinerary around exactly what you want to do.",
    icon: "route",
  },
  {
    title: "Honeymoon Packages",
    description:
      "Ocean-view suites, candlelit dinners, and private moments — built for two, from arrival flowers to departure.",
    icon: "heart",
  },
  {
    title: "Family Holidays",
    description:
      "Kids-first pacing, safe transport, and hosts who handle the logistics so parents actually relax.",
    icon: "home",
  },
  {
    title: "Corporate Retreats",
    description:
      "Team trips to the hills or the coast with planning, logistics, and bonding activities handled end to end.",
    icon: "briefcase",
  },
  {
    title: "Adventure & Trekking",
    description:
      "Hill-tract treks, forest cruises, and off-the-map experiences with certified local guides and permits arranged.",
    icon: "mountain",
  },
];

export const specialOffers: Offer[] = [];

export const reviews: Review[] = [];

export const destinationsForHome: { slug: string; label: string }[] = [];
