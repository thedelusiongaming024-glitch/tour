import type { Tour } from "@/lib/types";

export const tours: Tour[] = [
  {
    slug: "coxs-bazar-classic-3d2n",
    title: "Cox's Bazar Classic — 3D/2N",
    destinationSlug: "coxs-bazar",
    duration: "3 Days / 2 Nights",
    startingPrice: 25000,
    discount: 2000,
    advancePercent: 40,
    category: "Group Tour",
    summary:
      "The definitive Cox's Bazar itinerary — 120km of beach, Marine Drive sunsets, and fresh seafood dinners by the Bay of Bengal.",
    description:
      "Spend three unhurried days along the longest natural sea beach in the world. Walk golden sand at dawn, drive the stunning Marine Drive to Himchari, and unwind at Kolatoli beachfront hotels each evening. This is the classic escape, refined: small group, local hosts, and zero hidden costs.",
    cover: { key: "coxsbazar", label: "Sunset over the Bay of Bengal" },
    gallery: [
      { key: "coxsbazar", label: "Sunset over the Bay of Bengal" },
      { key: "stmartins", label: "Azure island waters" },
    ],
    itinerary: [
      {
        day: 1,
        title: "Dhaka → Cox's Bazar",
        description:
          "Early morning departure. Arrive by noon, check into a beachfront hotel in Kolatoli, and take a first walk along Laboni Beach for the sunset.",
      },
      {
        day: 2,
        title: "Marine Drive & Himchari",
        description:
          "A morning drive along Marine Drive to Himchari National Park and waterfall viewpoint. Afternoon at Inani Beach — golden sand, coral pebbles, and swimming.",
      },
      {
        day: 3,
        title: "Return to Dhaka",
        description:
          "Breakfast by the sea, a final morning swim, then drive back to Dhaka arriving in the evening.",
      },
    ],
    inclusions: [
      "Return AC bus/coaster transport from Dhaka",
      "2 nights beachfront hotel (twin sharing)",
      "Daily breakfast and two seafood dinners",
      "Marine Drive & Himchari sightseeing",
      "Local English/Bangla speaking host",
      "All permits and tolls",
    ],
    exclusions: [
      "Lunch meals",
      "Personal shopping and activities (parasailing, jet ski)",
      "Travel insurance",
    ],
    accommodation: "Beachfront hotel, Kolatoli",
    transportation: "AC bus/coaster",
    meals: "2 breakfasts, 2 dinners",
    capacity: 24,
    departure: "Every Friday",
    meetingPoint: "Kakrail / Farmgate, Dhaka",
    faqs: [
      {
        question: "Can I book with an advance and pay the rest on tour day?",
        answer:
          "Yes. Book with a 40% advance to confirm your seat; the remaining balance is settled on the day of the tour by QR scan or online payment.",
      },
      {
        question: "Is the beach hotel close to the water?",
        answer:
          "Our Kolatoli hotel is within a 2–3 minute walk of Laboni Beach.",
      },
    ],
    featured: true,
  },
  {
    slug: "coxs-bazar-st-martins-combo",
    title: "Cox's Bazar + Saint Martin's Combo — 5D/4N",
    destinationSlug: "coxs-bazar",
    duration: "5 Days / 4 Nights",
    startingPrice: 42000,
    discount: 3000,
    advancePercent: 40,
    category: "Combo Tour",
    summary:
      "The best of the Bay — the world's longest beach plus the turquoise coral island of Saint Martin's, in one seamless itinerary.",
    description:
      "Combine Bangladesh's two most-loved coastlines. Four nights split between the sands of Cox's Bazar and the coral idyll of Saint Martin's Island, with a speedboat crossing, island time on white sand, and fresh seafood every evening. The complete southern escape.",
    cover: { key: "stmartins", label: "Turquoise island water" },
    gallery: [
      { key: "stmartins", label: "Turquoise island water" },
      { key: "coxsbazar", label: "Cox's Bazar shoreline" },
    ],
    itinerary: [
      {
        day: 1,
        title: "Dhaka → Cox's Bazar",
        description:
          "Drive to Cox's Bazar and settle into your beachfront hotel. Sunset walk on Laboni Beach.",
      },
      {
        day: 2,
        title: "Marine Drive & Himchari",
        description:
          "Explore Marine Drive, Himchari, and Inani Beach before a relaxed evening on the boardwalk.",
      },
      {
        day: 3,
        title: "Teknaf → Saint Martin's",
        description:
          "Early drive to Teknaf, launch crossing to Saint Martin's, and afternoon on Narikel Jinjira beach.",
      },
      {
        day: 4,
        title: "Island Day & Chhera Dwip",
        description:
          "Snorkelling, a low-tide walk to Chhera Dwip, crab curry lunch, and a sunset boat ride around the island.",
      },
      {
        day: 5,
        title: "Return to Dhaka",
        description:
          "Morning launch back to Teknaf and the long drive home, arriving late evening.",
      },
    ],
    inclusions: [
      "Return AC transport Dhaka ↔ Cox's Bazar",
      "Return speedboat/launch Teknaf ↔ Saint Martin's",
      "2 nights beachfront Cox's Bazar + 2 nights island cottage",
      "Breakfasts and island seafood meals",
      "Chhera Dwip and snorkelling excursion",
      "Local host for the full trip",
    ],
    exclusions: [
      "Lunches and personal drinks",
      "Optional scuba diving",
      "Travel insurance",
    ],
    accommodation: "Beachfront hotel + island beach cottage",
    transportation: "AC coach + speedboat/launch",
    meals: "4 breakfasts, 3 dinners",
    capacity: 16,
    departure: "Alternate Fridays",
    meetingPoint: "Kakrail / Farmgate, Dhaka",
    faqs: [
      {
        question: "How long is the crossing to the island?",
        answer:
          "Approximately 2.5–3 hours by launch, or faster by speedboat. We schedule to arrive with the midday calm.",
      },
    ],
    featured: true,
  },
  {
    slug: "honeymoon-coxs-bazar",
    title: "Honeymoon Suite — Cox's Bazar 4D/3N",
    destinationSlug: "coxs-bazar",
    duration: "4 Days / 3 Nights",
    startingPrice: 56000,
    discount: 4000,
    advancePercent: 50,
    category: "Honeymoon",
    summary:
      "A private, romantic escape — ocean-view suite, candlelit dinners, and champagne sunsets on the longest beach in the world.",
    description:
      "Designed for two. A private ocean-view suite, a couple's dinner by the shore, and unhurried days on the sand with your own dedicated host arranging everything. Special touches from arrival flowers to a sunset boat ride for two.",
    cover: { key: "coxsbazar", label: "Sunset for two over the bay" },
    gallery: [
      { key: "coxsbazar", label: "Sunset over the bay" },
      { key: "stmartins", label: "Turquoise island water" },
    ],
    itinerary: [
      {
        day: 1,
        title: "Private Arrival",
        description:
          "Private car to Cox's Bazar and check-in to an ocean-view suite with flowers and a welcome hamper.",
      },
      {
        day: 2,
        title: "Sunset Marine Drive",
        description:
          "A private tour of Marine Drive and Himchari with a photographer stop, then a candlelit beach dinner.",
      },
      {
        day: 3,
        title: "Island Day Trip",
        description:
          "Optional speedboat day to a private sandbank with a picnic lunch — or a lazy day at the resort spa.",
      },
      {
        day: 4,
        title: "Return Home",
        description:
          "Breakfast on the balcony and a private car back to Dhaka.",
      },
    ],
    inclusions: [
      "Private AC car both ways",
      "3 nights ocean-view suite",
      "Flowers, welcome hamper, arrival photos",
      "Candlelit beach dinner for two",
      "Marine Drive private tour",
      "Dedicated personal host",
    ],
    exclusions: ["Spa treatments", "Extra activities"],
    accommodation: "Ocean-view suite, Cox's Bazar",
    transportation: "Private AC car",
    meals: "3 breakfasts, 2 dinners",
    capacity: 2,
    departure: "Anytime (on request)",
    meetingPoint: "Door-to-door pickup",
    faqs: [
      {
        question: "Can we add a Saint Martin's extension?",
        answer:
          "Yes — we can extend this package to 6D/5N including the island for honeymooners.",
      },
    ],
    featured: true,
  },
  {
    slug: "st-martins-island-escape",
    title: "Saint Martin's Island Escape — 4D/3N",
    destinationSlug: "saint-martins",
    duration: "4 Days / 3 Nights",
    startingPrice: 38000,
    discount: 2000,
    advancePercent: 40,
    category: "Group Tour",
    summary:
      "Three full days on Bangladesh's coral island — snorkelling, low-tide sandbars, and slow island living.",
    description:
      "Spend three nights on Narikel Jinjira, the island of coconuts. Days are for snorkelling turquoise water, walking to Chhera Dwip at low tide, and eating fresh crab curry on the beach. Evenings bring sunset boat rides and the island's gentle rhythm.",
    cover: { key: "stmartins", label: "White sand and turquoise water" },
    gallery: [
      { key: "stmartins", label: "White sand and turquoise water" },
      { key: "coxsbazar", label: "Cox's Bazar shoreline" },
    ],
    itinerary: [
      {
        day: 1,
        title: "Dhaka → Teknaf → Island",
        description:
          "Overnight or early-morning crossing to the island and check-in to your beach cottage.",
      },
      {
        day: 2,
        title: "Chhera Dwip & Snorkelling",
        description:
          "Low-tide walk to Chhera Dwip, snorkelling at the south reef, and a crab curry dinner by the water.",
      },
      {
        day: 3,
        title: "Island Village Day",
        description:
          "Bike around the island, meet the fishing community, and take a sunset boat trip around the shore.",
      },
      {
        day: 4,
        title: "Return to Dhaka",
        description:
          "Morning launch to Teknaf and transport back to Dhaka.",
      },
    ],
    inclusions: [
      "Return AC transport from Dhaka",
      "Launch transfers Teknaf ↔ island",
      "3 nights beach cottage",
      "All breakfasts and island dinners",
      "Snorkelling gear and Chhera Dwip trip",
      "Local island host",
    ],
    exclusions: ["Lunches", "Personal items", "Insurance"],
    accommodation: "Beach cottage, Saint Martin's",
    transportation: "AC coach + launch",
    meals: "3 breakfasts, 3 dinners",
    capacity: 20,
    departure: "Weekly (seasonal)",
    meetingPoint: "Kakrail, Dhaka",
    faqs: [],
  },
  {
    slug: "sundarbans-cruise-3d2n",
    title: "Sundarbans Cruise — 3D/2N",
    destinationSlug: "sundarbans",
    duration: "3 Days / 2 Nights",
    startingPrice: 35000,
    discount: 2500,
    advancePercent: 40,
    category: "Adventure",
    summary:
      "Two nights aboard a comfortable cruise vessel through the mangrove kingdom — tiger country, dolphin channels, and forest silence.",
    description:
      "Sail the tidal rivers of the world's largest mangrove forest on a comfortable cabin vessel. Explore forest watchtowers, spot deer and crocodiles from the deck, and glide into silent creeks where the Royal Bengal Tiger still walks. Includes forest permits, a naturalist guide, and full board.",
    cover: { key: "sundarbans", label: "Mangrove channels at dawn" },
    gallery: [
      { key: "sundarbans", label: "Mangrove channels at dawn" },
      { key: "khulna", label: "River journeys through the delta" },
    ],
    itinerary: [
      {
        day: 1,
        title: "Khulna → Sundarbans",
        description:
          "Board the cruise vessel at Khulna and sail into the forest. Evening at Kotka with wildlife viewpoint.",
      },
      {
        day: 2,
        title: "Kotka & Karambol",
        description:
          "Forest walk with rangers, watchtower visits, and a late-afternoon cruise through dolphin channels.",
      },
      {
        day: 3,
        title: "Dublar Char → Khulna",
        description:
          "Morning visit to Dublar Char fishing island, then sail back to Khulna to complete the journey.",
      },
    ],
    inclusions: [
      "Cabin accommodation on cruise vessel",
      "All meals on board",
      "Forest permits and entry fees",
      "Naturalist guide and forest ranger",
      "Watchtower visits",
      "Safety equipment and life jackets",
    ],
    exclusions: ["Personal drinks", "Tips", "Insurance"],
    accommodation: "Cruise vessel cabins",
    transportation: "Cruise vessel + bus Khulna transfers",
    meals: "All meals on board",
    capacity: 18,
    departure: "Twice weekly, Nov–Mar",
    meetingPoint: "Khulna launch terminal",
    faqs: [
      {
        question: "Will we see a tiger?",
        answer:
          "Tiger sightings are rare, but you will see pugmarks, deer, crocodiles, and dolphins. The forest itself is the main event.",
      },
    ],
    featured: true,
  },
  {
    slug: "sundarbans-express-2d1n",
    title: "Sundarbans Express — 2D/1N",
    destinationSlug: "sundarbans",
    duration: "2 Days / 1 Night",
    startingPrice: 22000,
    discount: 1000,
    advancePercent: 40,
    category: "Weekend",
    summary:
      "A fast, deep-cut weekend taste of the mangroves for those short on days but long on curiosity.",
    description:
      "The essential Sundarbans in 48 hours. A night aboard the vessel, a dawn watchtower visit, and a cruise past the wildlife channels of the outer forest. Designed for busy travelers who want the experience, not just the postcard.",
    cover: { key: "sundarbans", label: "Mangrove silhouette at golden hour" },
    gallery: [{ key: "sundarbans", label: "Mangrove silhouette at golden hour" }],
    itinerary: [
      {
        day: 1,
        title: "Khulna → Sundarbans",
        description:
          "Board at Khulna, sail to the outer forest, and overnight at Kotka with an evening viewpoint walk.",
      },
      {
        day: 2,
        title: "Dawn Cruise & Return",
        description:
          "Dawn wildlife cruise through the channels, breakfast on board, and return to Khulna by afternoon.",
      },
    ],
    inclusions: [
      "Cabin accommodation",
      "All meals",
      "Permits and guide",
      "Watchtower visit",
    ],
    exclusions: ["Personal items", "Insurance"],
    accommodation: "Cruise vessel cabin",
    transportation: "Cruise vessel + bus",
    meals: "All meals on board",
    capacity: 20,
    departure: "Fri–Sat weekly",
    meetingPoint: "Khulna launch terminal",
    faqs: [],
  },
  {
    slug: "sylhet-tea-country-3d2n",
    title: "Sylhet Tea Country — 3D/2N",
    destinationSlug: "sylhet",
    duration: "3 Days / 2 Nights",
    startingPrice: 28000,
    discount: 1500,
    advancePercent: 40,
    category: "Group Tour",
    summary:
      "Tea gardens, misty hills, and a swamp forest — the green heart of northeastern Bangladesh.",
    description:
      "Three days in the emerald northeast. Walk endless tea estates near Srimangal, boat through the drowned trees of Ratargul Swamp Forest, and stand where the Jaflong river pours down from the hills. A gentle, beautiful, deeply green itinerary.",
    cover: { key: "sylhet", label: "Striped tea gardens at golden hour" },
    gallery: [
      { key: "sylhet", label: "Striped tea gardens" },
      { key: "ratargul", label: "Ratargul Swamp Forest" },
      { key: "jaflong", label: "Jaflong river" },
    ],
    itinerary: [
      {
        day: 1,
        title: "Dhaka → Srimangal",
        description:
          "Drive to Srimangal, check into a heritage tea bungalow, and an afternoon walk through the estate.",
      },
      {
        day: 2,
        title: "Ratargul & Jaflong",
        description:
          "Morning boat ride at Ratargul Swamp Forest, then on to Jaflong for the river, hills, and floating stone boats.",
      },
      {
        day: 3,
        title: "Tea Estates & Return",
        description:
          "Tea tasting and a final estate drive before returning to Dhaka.",
      },
    ],
    inclusions: [
      "Return AC transport",
      "2 nights heritage tea bungalow",
      "Breakfasts and two dinners",
      "Ratargul boat ride",
      "Tea estate guided tour",
      "Local host",
    ],
    exclusions: ["Lunches", "Personal items", "Insurance"],
    accommodation: "Heritage tea bungalow",
    transportation: "AC car/van",
    meals: "2 breakfasts, 2 dinners",
    capacity: 10,
    departure: "Every Friday",
    meetingPoint: "Kakrail, Dhaka",
    faqs: [],
  },
  {
    slug: "sylhet-ratargul-jaflong",
    title: "Sylhet & Ratargul — 2D/1N",
    destinationSlug: "sylhet",
    duration: "2 Days / 1 Night",
    startingPrice: 19000,
    discount: 1000,
    advancePercent: 40,
    category: "Weekend",
    summary:
      "A swift weekend into the swamp forest and the tea hills — the greenest 48 hours in Bangladesh.",
    description:
      "Leave Friday, return Sunday. A boat ride through the mysterious Ratargul Swamp Forest, tea gardens near Sylhet city, and the scenic Bichanakandi river confluence. Compact, green, and refreshingly cool.",
    cover: { key: "ratargul", label: "Submerged trees of Ratargul" },
    gallery: [
      { key: "ratargul", label: "Submerged trees of Ratargul" },
      { key: "sylhet", label: "Sylhet tea gardens" },
    ],
    itinerary: [
      {
        day: 1,
        title: "Dhaka → Ratargul → Sylhet",
        description:
          "Morning drive to Ratargul, boat ride through the swamp forest, then overnight in Sylhet.",
      },
      {
        day: 2,
        title: "Bichanakandi & Return",
        description:
          "Sunrise at Bichanakandi river confluence, tea garden drive, then return to Dhaka.",
      },
    ],
    inclusions: [
      "Return AC transport",
      "1 night hotel in Sylhet",
      "Breakfast",
      "Ratargul boat ride",
      "Local guide",
    ],
    exclusions: ["Lunches", "Personal items"],
    accommodation: "3-star hotel, Sylhet",
    transportation: "AC car/van",
    meals: "1 breakfast",
    capacity: 12,
    departure: "Every Saturday",
    meetingPoint: "Kakrail, Dhaka",
    faqs: [],
  },
  {
    slug: "bandarban-hills-2d1n",
    title: "Bandarban Hills — 2D/1N",
    destinationSlug: "bandarban",
    duration: "2 Days / 1 Night",
    startingPrice: 21000,
    discount: 1000,
    advancePercent: 40,
    category: "Adventure",
    summary:
      "Nilgiri viewpoints, tribal villages, and the road above the clouds — a compact highland escape.",
    description:
      "Head for the highest horizons in Bangladesh. From the sweeping views at Nilgiri to the hanging bridge at Meghla and a cruise along the Sangu river, this is the classic Bandarban highlands in a tight, well-paced two days.",
    cover: { key: "bandarban", label: "Misty ridgelines at sunrise" },
    gallery: [
      { key: "bandarban", label: "Misty ridgelines" },
      { key: "sajek", label: "Sajek cloud sea" },
    ],
    itinerary: [
      {
        day: 1,
        title: "Dhaka → Bandarban",
        description:
          "Drive to Bandarban, afternoon at Meghla and the hanging bridge, sunset at Chimbuk.",
      },
      {
        day: 2,
        title: "Nilgiri & Sangu River",
        description:
          "Dawn at Nilgiri viewpoint, a Sangu river boat ride, then return to Dhaka.",
      },
    ],
    inclusions: [
      "Return AC transport",
      "1 night hill resort",
      "Breakfast and dinner",
      "Nilgiri & Chimbuk entry",
      "Hill tract permits",
      "Local guide",
    ],
    exclusions: ["Lunches", "Personal items", "Insurance"],
    accommodation: "Hill resort, Bandarban",
    transportation: "AC car/van",
    meals: "1 breakfast, 1 dinner",
    capacity: 10,
    departure: "Every Saturday",
    meetingPoint: "Kakrail, Dhaka",
    faqs: [
      {
        question: "Do we need hill tract permits?",
        answer:
          "Yes — for non-residents of the Chittagong Hill Tracts. We arrange all permits for you as part of the package.",
      },
    ],
  },
  {
    slug: "boga-lake-trekking",
    title: "Boga Lake Trekking — 3D/2N",
    destinationSlug: "bandarban",
    duration: "3 Days / 2 Nights",
    startingPrice: 32000,
    discount: 2000,
    advancePercent: 40,
    category: "Adventure",
    summary:
      "Trek to the hidden lake cradled by Bangladesh's highest peaks, with a night above the clouds.",
    description:
      "A proper mountain trek to Boga Lake — a jade-green lake at 1,200ft surrounded by forested peaks. Camp or stay in a tribal eco-cabin, wake to fog lifting off the water, and trek back through the hill villages. Fitness required, reward guaranteed.",
    cover: { key: "bandarban", label: "Boga Lake in the morning mist" },
    gallery: [
      { key: "bandarban", label: "Boga Lake in the morning mist" },
      { key: "rangamati", label: "Kaptai Lake" },
    ],
    itinerary: [
      {
        day: 1,
        title: "Dhaka → Thanchi",
        description:
          "Drive to Thanchi, overnight in a riverside guest house on the Sangu river.",
      },
      {
        day: 2,
        title: "Trek to Boga Lake",
        description:
          "Full-day trek to Boga Lake with a local guide; overnight in eco-cabins by the lake.",
      },
      {
        day: 3,
        title: "Descent & Return",
        description:
          "Morning swim (brave souls), trek down, and drive back to Dhaka.",
      },
    ],
    inclusions: [
      "Return AC transport",
      "1 night river guest house + 1 night eco-cabin",
      "Local trekking guide and porters",
      "All meals during trek",
      "Permits",
    ],
    exclusions: ["Personal trekking gear", "Insurance"],
    accommodation: "Guest house + eco-cabin",
    transportation: "AC van + trekking",
    meals: "All meals included",
    capacity: 8,
    departure: "Fortnightly",
    meetingPoint: "Kakrail, Dhaka",
    faqs: [],
  },
  {
    slug: "rangamati-lake-retreat-2d1n",
    title: "Rangamati Lake Retreat — 2D/1N",
    destinationSlug: "rangamati",
    duration: "2 Days / 1 Night",
    startingPrice: 20000,
    discount: 1000,
    advancePercent: 40,
    category: "Weekend",
    summary:
      "Kaptai Lake, the hanging bridge, and a cruise between forested islands — the lake city in a weekend.",
    description:
      "Two days along the vast Kaptai Lake. Cruise past islands, cross the Jhulonto Bridge, visit the golden Buddha Dhatu Jadi, and stay in a lake-facing cottage to watch the water change colour at dusk.",
    cover: { key: "rangamati", label: "Kaptai Lake at dusk" },
    gallery: [
      { key: "rangamati", label: "Kaptai Lake at dusk" },
      { key: "bandarban", label: "Bandarban hills" },
    ],
    itinerary: [
      {
        day: 1,
        title: "Dhaka → Rangamati",
        description:
          "Drive to Rangamati, lake cruise, hanging bridge, and an evening at the lake-front bazaar.",
      },
      {
        day: 2,
        title: "Buddha Dhatu Jadi & Return",
        description:
          "Visit the golden pagoda and tribal museum before returning to Dhaka.",
      },
    ],
    inclusions: [
      "Return AC transport",
      "1 night lake cottage",
      "Breakfast and dinner",
      "Boat tour",
      "Permits and guide",
    ],
    exclusions: ["Lunches", "Personal items"],
    accommodation: "Lake cottage, Rangamati",
    transportation: "AC car/van",
    meals: "1 breakfast, 1 dinner",
    capacity: 12,
    departure: "Every Saturday",
    meetingPoint: "Kakrail, Dhaka",
    faqs: [],
  },
  {
    slug: "sajek-valley-3d2n",
    title: "Sajek Valley — 3D/2N",
    destinationSlug: "sajek-valley",
    duration: "3 Days / 2 Nights",
    startingPrice: 30000,
    discount: 2000,
    advancePercent: 40,
    category: "Adventure",
    summary:
      "Two nights above the cloud sea — hilltop cottages, sunrise viewpoints, and the winding road to the kingdom of clouds.",
    description:
      "The complete Sajek experience. Two nights in a hillside cottage above the valley, sunrise from Konglak hill, visits to the Kuki tribal villages, and the unforgettable jeep climb up the mountain road. Go early in the season for the famous cloud sea.",
    cover: { key: "sajek", label: "A sea of clouds below the ridge" },
    gallery: [
      { key: "sajek", label: "Cloud sea below the ridge" },
      { key: "bandarban", label: "Bandarban ridgelines" },
      { key: "rangamati", label: "Kaptai Lake at dusk" },
    ],
    itinerary: [
      {
        day: 1,
        title: "Dhaka → Dighinala → Sajek",
        description:
          "Drive to Dighinala, transfer to jeeps for the mountain climb, and arrive at your cottage by late afternoon.",
      },
      {
        day: 2,
        title: "Sunrise & Konglak Hill",
        description:
          "Pre-dawn walk to Konglak viewpoint for the sunrise over the cloud sea. Afternoon visit to the Kuki village and Malampara viewpoint.",
      },
      {
        day: 3,
        title: "Descent & Return",
        description:
          "Morning coffee over the valley, jeep descent, and drive back to Dhaka.",
      },
    ],
    inclusions: [
      "Return AC transport to Dighinala",
      "Jeep transfers up the mountain",
      "2 nights hilltop cottage",
      "Breakfasts and two dinners",
      "Sunrise viewpoint walks",
      "Permits and local guide",
    ],
    exclusions: ["Lunches", "Personal items", "Insurance"],
    accommodation: "Hilltop cottage, Sajek",
    transportation: "AC van + jeep",
    meals: "2 breakfasts, 2 dinners",
    capacity: 16,
    departure: "Every Friday",
    meetingPoint: "Kakrail, Dhaka",
    faqs: [
      {
        question: "Is the jeep ride comfortable?",
        answer:
          "The mountain road is bumpy for about 2 hours. Pack light and enjoy the views — it's part of the experience.",
      },
    ],
    featured: true,
  },
  {
    slug: "sajek-weekend-getaway",
    title: "Sajek Weekend Getaway — 2D/1N",
    destinationSlug: "sajek-valley",
    duration: "2 Days / 1 Night",
    startingPrice: 19500,
    discount: 1000,
    advancePercent: 40,
    category: "Weekend",
    summary:
      "The cloud-sea kingdom in a fast, well-timed weekend for travelers with limited leave.",
    description:
      "Leave Friday night, wake above the clouds. Sunrise at Konglak, a day of viewpoints and tribal villages, and back to Dhaka by Sunday night. The essential Sajek, compressed.",
    cover: { key: "sajek", label: "Cloud sea at first light" },
    gallery: [{ key: "sajek", label: "Cloud sea at first light" }],
    itinerary: [
      {
        day: 1,
        title: "Night Drive to Sajek",
        description:
          "Evening departure from Dhaka, overnight drive to Dighinala, and early-morning jeep transfer up the mountain.",
      },
      {
        day: 2,
        title: "Sunrise, Villages & Return",
        description:
          "Konglak sunrise, tribal village visit, then descend and drive back to Dhaka.",
      },
    ],
    inclusions: [
      "Return AC transport",
      "Jeep transfers",
      "1 night cottage",
      "Breakfast",
      "Permits and guide",
    ],
    exclusions: ["Lunches", "Personal items"],
    accommodation: "Hilltop cottage, Sajek",
    transportation: "AC van + jeep",
    meals: "1 breakfast",
    capacity: 16,
    departure: "Every Saturday",
    meetingPoint: "Kakrail, Dhaka",
    faqs: [],
  },
  {
    slug: "kuakata-sea-of-sunsets-2d1n",
    title: "Kuakata — Sea of Sunsets 2D/1N",
    destinationSlug: "kuakata",
    duration: "2 Days / 1 Night",
    startingPrice: 18500,
    discount: 1000,
    advancePercent: 40,
    category: "Weekend",
    summary:
      "Watch both sunrise and sunset over the Bay of Bengal on the daughter of the sea.",
    description:
      "A serene two days at the beach where the sun rises and sets in the water. Long golden-sand walks, a sunset boat ride, visits to the Rakhine Buddhist temples, and the quiet soul of Kuakata.",
    cover: { key: "kuakata", label: "Sunrise and sunset over the bay" },
    gallery: [
      { key: "kuakata", label: "Sunrise and sunset over the bay" },
      { key: "coxsbazar", label: "Cox's Bazar shoreline" },
    ],
    itinerary: [
      {
        day: 1,
        title: "Dhaka → Kuakata",
        description:
          "Drive to Kuakata, late-afternoon walk to the eastern point for sunset, and a seafood dinner.",
      },
      {
        day: 2,
        title: "Sunrise & Return",
        description:
          "Dawn at the eastern point for sunrise, visit the Rakhine temples, then return to Dhaka.",
      },
    ],
    inclusions: [
      "Return AC transport",
      "1 night beach hotel",
      "Breakfast",
      "Sunset boat ride",
      "Local guide",
    ],
    exclusions: ["Lunches", "Personal items"],
    accommodation: "Beach hotel, Kuakata",
    transportation: "AC coach",
    meals: "1 breakfast",
    capacity: 20,
    departure: "Every Saturday",
    meetingPoint: "Kakrail, Dhaka",
    faqs: [],
  },
  {
    slug: "dhaka-heritage-day",
    title: "Old Dhaka Heritage Day",
    destinationSlug: "dhaka",
    duration: "1 Day",
    startingPrice: 8500,
    discount: 0,
    advancePercent: 100,
    category: "Day Trip",
    summary:
      "A guided deep-dive into Old Dhaka — Mughal forts, the river port, rickshaw lanes, and the city's living history.",
    description:
      "The chaos of Dhaka, decoded. With an expert guide, cross Old Dhaka by rickshaw and foot: Lalbagh Fort, the Ahsan Manzil river palace, the mad rush of Sadarghat, the crafts of Shankhari Bazaar, and a sunset cruise on the Buriganga. Lunch at a legendary Dhaka biryani house.",
    cover: { key: "dhaka", label: "Rickshaws of Old Dhaka" },
    gallery: [
      { key: "dhaka", label: "Rickshaws of Old Dhaka" },
      { key: "sonargaon", label: "Panam City near the capital" },
    ],
    itinerary: [
      {
        day: 1,
        title: "A Day in Old Dhaka",
        description:
          "Lalbagh Fort → Ahsan Manzil → Sadarghat river port → Shankhari Bazaar → biryani lunch → Buriganga sunset cruise.",
      },
    ],
    inclusions: [
      "Expert heritage guide",
      "Rickshaw and boat rides",
      "Entry tickets",
      "Legendary biryani lunch",
      "Buriganga sunset cruise",
    ],
    exclusions: ["Personal shopping", "Hotel pickup (optional add-on)"],
    accommodation: "—",
    transportation: "Rickshaw, boat, walking",
    meals: "1 lunch",
    capacity: 12,
    departure: "Daily (except Fridays)",
    meetingPoint: "Lalbagh Fort gate",
    faqs: [],
  },
  {
    slug: "north-bangladesh-archaeology-2d1n",
    title: "North Bangladesh Archaeology — 2D/1N",
    destinationSlug: "paharpur",
    duration: "2 Days / 1 Night",
    startingPrice: 23000,
    discount: 1000,
    advancePercent: 40,
    category: "Heritage",
    summary:
      "Paharpur's great Buddhist monastery and the 2,000-year-old citadel of Mahasthangarh — the archaeology of an ancient Bengal.",
    description:
      "A journey into the deep past. Walk the vast red-brick courtyard of Somapura Mahavihara — the largest Buddhist monastery south of the Himalayas — then travel back further still to Mahasthangarh, Bangladesh's oldest city. With an archaeologically trained guide.",
    cover: { key: "paharpur", label: "The vast red-brick monastery courtyard" },
    gallery: [
      { key: "paharpur", label: "The vast red-brick monastery courtyard" },
      { key: "sonargaon", label: "Panam City ruins" },
    ],
    itinerary: [
      {
        day: 1,
        title: "Dhaka → Paharpur",
        description:
          "Drive to Naogaon and spend the afternoon among the ruins of Somapura Mahavihara and its museum.",
      },
      {
        day: 2,
        title: "Mahasthangarh & Return",
        description:
          "Morning at the Mahasthangarh citadel and Gokul Medh, then return to Dhaka.",
      },
    ],
    inclusions: [
      "Return AC transport",
      "1 night hotel",
      "Breakfast",
      "Guided tours with archaeologist",
      "Entry tickets",
    ],
    exclusions: ["Lunches", "Personal items"],
    accommodation: "Hotel, Bogra",
    transportation: "AC car/van",
    meals: "1 breakfast",
    capacity: 8,
    departure: "Fortnightly",
    meetingPoint: "Kakrail, Dhaka",
    faqs: [],
  },
];

export function getTour(slug: string): Tour | undefined {
  return tours.find((t) => t.slug === slug);
}

export function toursByDestination(destinationSlug: string): Tour[] {
  return tours.filter((t) => t.destinationSlug === destinationSlug);
}
