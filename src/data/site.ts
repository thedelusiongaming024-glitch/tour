import type { Review, Service, Offer } from "@/lib/types";

export const siteName = "ATITHI";
export const siteNameBn = "অতিথি";
export const siteTagline = "Discover Bangladesh, your way";
export const siteDescription =
  "Curated domestic tours across Bangladesh. Trusted local hosts, transparent pricing, and complete financial clarity from booking to on-site payment clearance.";

export const heroStats = [
  { value: "12+", label: "Destinations" },
  { value: "1,200+", label: "Happy travelers" },
  { value: "4.9", label: "Average rating" },
  { value: "100%", label: "Local, verified hosts" },
];

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

export const specialOffers: Offer[] = [
  {
    title: "Early Bird — Sajek Cloud Season",
    description:
      "Book the Sajek 3D/2N at least 3 weeks ahead and save ৳2,000 per person this season.",
    code: "CLOUDSEA20",
    badge: "Save ৳2,000",
    expiry: "Valid for December departures",
  },
  {
    title: "Group of 6+",
    description:
      "Travel with six or more and everyone saves 10% on any group tour package.",
    code: "GROUP10",
    badge: "10% off",
    expiry: "All year round",
  },
  {
    title: "Honeymoon Week",
    description:
      "Add a free couple's sunset dinner and arrival photos to any honeymoon package this month.",
    code: "HONEYMOON",
    badge: "Free upgrade",
    expiry: "Book in August",
  },
];

export const reviews: Review[] = [
  {
    name: "Nusrat Jahan",
    location: "Dhaka",
    tour: "Sajek Valley 3D/2N",
    rating: 5,
    text: "The cloud sea at sunrise was unreal — I genuinely thought we were on an airplane. Our host took us to a ridge walk the guidebooks don't know. Booking took five minutes and the QR payment on the last day was seamless.",
  },
  {
    name: "Imran Kabir",
    location: "Chattogram",
    tour: "Sundarbans Cruise 3D/2N",
    rating: 5,
    text: "I've been on fishing trips my whole life and nothing prepared me for the silence of the deep mangrove channels. Dolphins off the bow at dusk. The boat, the food, the naturalist — all excellent.",
  },
  {
    name: "Sadia Rahman",
    location: "Sylhet",
    tour: "Cox's Bazar + Saint Martin's",
    rating: 5,
    text: "The whole family went. Kids loved the island, I loved the fact that there were zero hidden charges — what they quoted was what we paid. The balance-on-tour-day option made it really easy.",
  },
  {
    name: "Mehedi Hasan",
    location: "Dhaka",
    tour: "Boga Lake Trek",
    rating: 5,
    text: "Genuinely hard trek, honestly described, and worth every step. The night beside the lake was the quietest I've had in years. Guide and porters were superb.",
  },
  {
    name: "Farhana Ahmed",
    location: "Dhaka",
    tour: "Honeymoon Suite, Cox's Bazar",
    rating: 5,
    text: "Arrival flowers, a candlelit beach dinner, and a host who quietly handled everything. It felt like they'd planned it for us specifically. The dual confirmation for our balance payment was reassuring.",
  },
  {
    name: "Arif Chowdhury",
    location: "Khulna",
    tour: "Old Dhaka Heritage Day",
    rating: 5,
    text: "I'm from Bangladesh and I still learned more in one day than in years of visiting Dhaka. The biryani stop alone was worth it. Guide was fantastic.",
  },
];

export const destinationsForHome = [
  { slug: "coxs-bazar", label: "Cox's Bazar" },
  { slug: "sylhet", label: "Sylhet" },
  { slug: "sundarbans", label: "Sundarbans" },
  { slug: "bandarban", label: "Bandarban" },
  { slug: "sajek-valley", label: "Sajek Valley" },
  { slug: "saint-martins", label: "Saint Martin's" },
];
