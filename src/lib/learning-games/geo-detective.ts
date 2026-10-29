export interface GeoChoice {
  id: string;
  label: string;
  note: string;
}

export interface GeoMission {
  id: string;
  title: string;
  chapter: string;
  difficulty: "Starter" | "Explorer" | "Expert";
  objective: string;
  clues: [string, string, string];
  choices: [GeoChoice, GeoChoice, GeoChoice, GeoChoice];
  answerId: string;
  explanation: string;
  takeaway: string;
}

export const GEO_DETECTIVE_MISSIONS: readonly GeoMission[] = [
  {
    id: "western-ghats",
    title: "The Monsoon Wall",
    chapter: "Climate & Relief",
    difficulty: "Starter",
    objective: "Connect relief to rainfall distribution.",
    clues: [
      "I run roughly parallel to India's western coast.",
      "Moist south-west monsoon winds rise on my windward slopes and often bring heavy orographic rainfall.",
      "I form a nearly continuous mountain chain west of the Deccan Plateau.",
    ],
    choices: [
      { id: "aravalli", label: "Aravalli Range", note: "An old range running broadly south-west to north-east in western India." },
      { id: "western-ghats", label: "Western Ghats", note: "A mountain chain beside India's western coast." },
      { id: "eastern-ghats", label: "Eastern Ghats", note: "A discontinuous range along parts of India's eastern side." },
      { id: "himalayas", label: "Himalayas", note: "The high mountain system along northern India." },
    ],
    answerId: "western-ghats",
    explanation: "The Western Ghats stand close to the Arabian Sea coast. Moist monsoon air is forced upward over the slopes, cools and condenses, producing heavy rain on windward slopes. Rainfall is often lower on the leeward side of the range.",
    takeaway: "Relief can shape rainfall. This is called orographic rainfall, and the leeward side may lie in a rain-shadow region.",
  },
  {
    id: "northern-plains",
    title: "The Fertile Belt",
    chapter: "Physical Features of India",
    difficulty: "Starter",
    objective: "Identify a depositional landform and explain its fertility.",
    clues: [
      "I lie south of the Himalayas and stretch across a large part of northern India.",
      "Rivers have deposited thick layers of fine alluvium across me over long periods.",
      "My level terrain and fertile soils support dense settlement and intensive agriculture.",
    ],
    choices: [
      { id: "thar-desert", label: "Indian Desert", note: "An arid region in western India." },
      { id: "northern-plains", label: "Northern Plains", note: "A broad alluvial plain south of the Himalayas." },
      { id: "deccan-plateau", label: "Deccan Plateau", note: "A large elevated plateau of peninsular India." },
      { id: "coastal-plains", label: "Coastal Plains", note: "Low-lying plains beside the sea." },
    ],
    answerId: "northern-plains",
    explanation: "The Northern Plains were built mainly by alluvial deposits from the Indus, Ganga and Brahmaputra river systems and their tributaries. The deep, renewed alluvium, relatively level land and water availability support intensive farming and extensive settlement.",
    takeaway: "Alluvium is material deposited by rivers. A depositional plain can be fertile, but flood risk also needs to be managed.",
  },
  {
    id: "himalayas",
    title: "The Young Fold Mountains",
    chapter: "Physical Features of India",
    difficulty: "Starter",
    objective: "Distinguish the Himalayas from older peninsular landforms.",
    clues: [
      "I form a high arc along India's northern boundary.",
      "I am geologically young compared with the ancient Peninsular Plateau and contain many high peaks and deep valleys.",
      "I influence climate and feed important river systems through snow and glacier melt as well as rainfall.",
    ],
    choices: [
      { id: "himalayas", label: "Himalayas", note: "High young fold mountains in the north." },
      { id: "western-ghats", label: "Western Ghats", note: "A mountain chain along the western edge of the plateau." },
      { id: "aravalli", label: "Aravalli Range", note: "An ancient range in western India." },
      { id: "eastern-ghats", label: "Eastern Ghats", note: "Older, discontinuous hills along the east." },
    ],
    answerId: "himalayas",
    explanation: "The Himalayas are young fold mountains formed by tectonic collision between the Indian and Eurasian plates. Their height and orientation influence atmospheric circulation, while snow, ice and monsoon rainfall feed several major river systems.",
    takeaway: "Young fold mountains and the older Peninsular Plateau differ in geological history, relief and landscape processes.",
  },
  {
    id: "indian-desert",
    title: "The Low-Rainfall Mystery",
    chapter: "Climate of India",
    difficulty: "Starter",
    objective: "Relate aridity, rainfall and vegetation.",
    clues: [
      "I occupy much of western Rajasthan, to the west of the Aravalli Range.",
      "Rainfall is very low and uncertain, and some places have shifting sand dunes.",
      "Sparse vegetation and water scarcity are important environmental challenges here.",
    ],
    choices: [
      { id: "northern-plains", label: "Northern Plains", note: "A fertile alluvial belt in northern India." },
      { id: "indian-desert", label: "Indian Desert", note: "An arid region of western Rajasthan." },
      { id: "western-ghats", label: "Western Ghats", note: "A high-relief monsoon barrier in the west." },
      { id: "brahmaputra-valley", label: "Brahmaputra Valley", note: "A river valley in the north-east." },
    ],
    answerId: "indian-desert",
    explanation: "The Indian Desert, often called the Thar Desert, lies mainly in western Rajasthan. Low and irregular rainfall, high evaporation and water scarcity shape its dry environment; livelihoods and settlement depend heavily on local water access and adaptation.",
    takeaway: "Aridity is not only about high temperature: it reflects water availability, especially rainfall relative to evaporation.",
  },
  {
    id: "eastern-ghats",
    title: "The Broken Mountain Chain",
    chapter: "Physical Features of India",
    difficulty: "Explorer",
    objective: "Compare the Western and Eastern Ghats.",
    clues: [
      "I extend in sections along India's eastern side, broadly parallel to the Bay of Bengal coast.",
      "Major rivers, including the Mahanadi, Godavari, Krishna and Kaveri, cut across me on their way to the sea.",
      "Unlike the Western Ghats, I am discontinuous and generally lower.",
    ],
    choices: [
      { id: "western-ghats", label: "Western Ghats", note: "A relatively continuous range in the west." },
      { id: "eastern-ghats", label: "Eastern Ghats", note: "A discontinuous range along eastern peninsular India." },
      { id: "himalayas", label: "Himalayas", note: "The high mountain system in northern India." },
      { id: "aravalli", label: "Aravalli Range", note: "An ancient range in western India." },
    ],
    answerId: "eastern-ghats",
    explanation: "The Eastern Ghats are a discontinuous chain of hills along eastern peninsular India. Large rivers cut through them and form deltas on the coast, one reason the range does not appear as continuous as the Western Ghats.",
    takeaway: "River valleys and drainage can interrupt a mountain chain. Compare the continuity, height and coastal position of both Ghats.",
  },
  {
    id: "deccan-plateau",
    title: "The Ancient Uplands",
    chapter: "Physical Features of India",
    difficulty: "Explorer",
    objective: "Recognise the old stable landmass of peninsular India.",
    clues: [
      "I cover a large triangular part of peninsular India.",
      "Much of my base is made of ancient crystalline igneous and metamorphic rocks.",
      "My broad uplands lie between the Western and Eastern Ghats, with rivers flowing towards different coasts.",
    ],
    choices: [
      { id: "northern-plains", label: "Northern Plains", note: "A low alluvial plain north of the plateau." },
      { id: "deccan-plateau", label: "Deccan Plateau", note: "An elevated tableland across much of peninsular India." },
      { id: "indian-desert", label: "Indian Desert", note: "A dry region in the north-west." },
      { id: "coastal-plains", label: "Coastal Plains", note: "Low-lying belts beside India's coasts." },
    ],
    answerId: "deccan-plateau",
    explanation: "The Deccan Plateau forms much of southern India and is part of the ancient Peninsular Plateau. Its rock structure, elevation, slope and river systems influence soils, drainage, settlement and land use.",
    takeaway: "A plateau is an elevated area with a relatively level or rolling surface; it is not the same as a mountain range or an alluvial plain.",
  },
  {
    id: "ganga",
    title: "The Great Northern River",
    chapter: "Drainage",
    difficulty: "Explorer",
    objective: "Connect river origin, course and basin.",
    clues: [
      "My headstream Bhagirathi rises near Gaumukh in the Gangotri Glacier region of the Himalayas.",
      "I flow across the northern plains, receive many tributaries and support a very large basin.",
      "I ultimately reach the Bay of Bengal as part of a vast delta system shared with other rivers.",
    ],
    choices: [
      { id: "narmada", label: "Narmada", note: "A major west-flowing river in a rift valley." },
      { id: "ganga", label: "Ganga", note: "A major Himalayan river flowing east across the northern plains." },
      { id: "godavari", label: "Godavari", note: "A major east-flowing river of peninsular India." },
      { id: "brahmaputra", label: "Brahmaputra", note: "A major river flowing through the north-east." },
    ],
    answerId: "ganga",
    explanation: "The Ganga begins as the Bhagirathi near Gaumukh in the Gangotri Glacier region. At Devprayag, the Bhagirathi and Alaknanda meet to form the Ganga. It flows across the northern plains, receives tributaries and forms a large delta system near the Bay of Bengal.",
    takeaway: "A river basin is the area drained by a river and its tributaries. River systems connect highlands, plains, wetlands and coastal environments.",
  },
  {
    id: "brahmaputra",
    title: "The River of the North-East",
    chapter: "Drainage",
    difficulty: "Explorer",
    objective: "Identify a river valley and understand seasonal flooding.",
    clues: [
      "After flowing east of the Himalayas, I enter India in Arunachal Pradesh, where I am known as the Siang/Dihang.",
      "I flow through Assam in a wide valley and receive many tributaries.",
      "High monsoon rainfall, sediment and changing channels contribute to flood and erosion challenges in my valley.",
    ],
    choices: [
      { id: "ganga", label: "Ganga", note: "The major river crossing the northern plains." },
      { id: "brahmaputra", label: "Brahmaputra", note: "The major river crossing Assam in the north-east." },
      { id: "narmada", label: "Narmada", note: "A west-flowing river in central India." },
      { id: "kaveri", label: "Kaveri", note: "A peninsular river flowing towards the south-east coast." },
    ],
    answerId: "brahmaputra",
    explanation: "The Brahmaputra flows from the Tibetan Plateau into Arunachal Pradesh, where its upper Indian course is known as the Siang/Dihang, and then through Assam. Monsoon rainfall, sediment load, tributaries and channel dynamics make flood management complex.",
    takeaway: "Flooding is influenced by rainfall, relief, river discharge, sediment, land use and infrastructure—not by one factor alone.",
  },
  {
    id: "eastern-coastal-plains",
    title: "The Delta Coast",
    chapter: "Physical Features of India",
    difficulty: "Explorer",
    objective: "Relate river deposition to coastal landforms.",
    clues: [
      "I stretch beside the Bay of Bengal along India's eastern seaboard.",
      "Several large east-flowing peninsular rivers deposit sediment as they approach the sea.",
      "Broad deltaic areas associated with the Mahanadi, Godavari, Krishna and Kaveri are features of my landscape.",
    ],
    choices: [
      { id: "western-coastal-plains", label: "Western Coastal Plains", note: "Often narrow, between the Western Ghats and Arabian Sea." },
      { id: "eastern-coastal-plains", label: "Eastern Coastal Plains", note: "Coastal plains on the Bay of Bengal side, with major river deltas." },
      { id: "northern-plains", label: "Northern Plains", note: "An extensive inland alluvial plain." },
      { id: "indian-desert", label: "Indian Desert", note: "An arid inland region in the north-west." },
    ],
    answerId: "eastern-coastal-plains",
    explanation: "The Eastern Coastal Plains border the Bay of Bengal. Large peninsular rivers flow east and build extensive deltas by depositing sediment near their mouths. The western coastal plains are generally narrower where the Western Ghats lie close to the sea.",
    takeaway: "Deltas form where a river deposits sediment as its flow slows on entering a standing body of water, subject to waves, tides and coastal processes.",
  },
  {
    id: "kerala-monsoon",
    title: "The First Monsoon Arrival",
    chapter: "Climate of India",
    difficulty: "Expert",
    objective: "Understand the typical onset of the south-west monsoon.",
    clues: [
      "In a typical year, the south-west monsoon first reaches the Indian mainland in my south-western coastal state.",
      "The Arabian Sea branch brings rain to the windward side of the Western Ghats.",
      "The normal onset is around the beginning of June, although actual dates vary from year to year.",
    ],
    choices: [
      { id: "kerala-monsoon", label: "Kerala Coast", note: "South-western coastal India, associated with the typical monsoon onset." },
      { id: "thar-desert", label: "Thar Desert", note: "A dry region in western Rajasthan." },
      { id: "punjab-plains", label: "Punjab Plains", note: "Farther inland in north-western India." },
      { id: "eastern-coast", label: "Eastern Coast", note: "Facing the Bay of Bengal." },
    ],
    answerId: "kerala-monsoon",
    explanation: "The south-west monsoon typically reaches Kerala around the beginning of June, marking its usual onset over the Indian mainland. The date is not fixed; the India Meteorological Department tracks onset using multiple meteorological criteria.",
    takeaway: "Climate descriptions use long-term patterns. A typical onset date is not a guarantee of the weather on a particular day or year.",
  },
  {
    id: "northern-plains-population",
    title: "The Densely Settled Belt",
    chapter: "Population Geography",
    difficulty: "Starter",
    objective: "Explain why fertile plains often support dense population distribution.",
    clues: [
      "I stretch across a broad belt south of the Himalayas and include level alluvial land.",
      "River water, fertile soils, agriculture and transport links support many settlements across parts of me.",
      "These favourable conditions help explain why population is dense in many areas of this region, although density still varies locally.",
    ],
    choices: [
      { id: "northern-plains", label: "Northern Plains", note: "Broad alluvial plains with extensive farming and settlement." },
      { id: "himalayas", label: "High Himalayas", note: "Rugged high-altitude terrain where many areas are harder to access." },
      { id: "indian-desert", label: "Indian Desert", note: "Arid areas where water availability is a major constraint." },
      { id: "deccan-plateau", label: "Deccan Plateau", note: "A large upland region with varied population density." },
    ],
    answerId: "northern-plains",
    explanation: "Population distribution is influenced by several interacting factors. In many parts of the Northern Plains, level terrain, alluvial soils, water availability, agriculture, roads and long-established settlements support high population density. Density is not uniform across the whole region.",
    takeaway: "Population density is the number of people living per unit of area. Fertile soil, water, relief, jobs and transport can affect where people live.",
  },
  {
    id: "himalayan-settlement",
    title: "The Mountain Settlement Puzzle",
    chapter: "Population Distribution",
    difficulty: "Explorer",
    objective: "Relate relief, climate and accessibility to settlement patterns.",
    clues: [
      "I form India's high mountain arc along the north.",
      "In many high-altitude parts of me, steep slopes, cold conditions, hazards and difficult transport limit the places where large settlements can expand.",
      "My valleys and foothills can be much more settled than the highest rugged areas, so population is uneven rather than uniformly sparse.",
    ],
    choices: [
      { id: "himalayas", label: "Himalayas", note: "High mountain terrain with varied settlement patterns." },
      { id: "northern-plains", label: "Northern Plains", note: "Broad, level areas with many dense settlements." },
      { id: "eastern-coastal-plains", label: "Eastern Coastal Plains", note: "Low-lying coastal regions with major agricultural and urban areas." },
      { id: "indian-desert", label: "Indian Desert", note: "A dry region where water scarcity strongly shapes settlement." },
    ],
    answerId: "himalayas",
    explanation: "Steep relief, altitude, cold conditions, landslide and earthquake risk in some areas, and limited transport can constrain settlement in high mountain environments. However, Himalayan valleys and foothills vary considerably; avoid assuming every mountain district has the same population density.",
    takeaway: "Population distribution is uneven. Physical factors matter, but roads, employment, services, history and local conditions also influence settlement.",
  },
  {
    id: "desert-population",
    title: "The Water-Scarcity Pattern",
    chapter: "Population Distribution",
    difficulty: "Explorer",
    objective: "Connect aridity and water access with population distribution.",
    clues: [
      "I cover a large arid area in western Rajasthan.",
      "Low and irregular rainfall makes dependable water supplies an important challenge in many parts of me.",
      "Settlements often depend on available water sources and can be widely spaced in drier areas.",
    ],
    choices: [
      { id: "indian-desert", label: "Indian Desert", note: "Arid parts of western Rajasthan with scarce and variable rainfall." },
      { id: "northern-plains", label: "Northern Plains", note: "Extensive alluvial plains with many river and canal systems." },
      { id: "brahmaputra-valley", label: "Brahmaputra Valley", note: "A river valley with high seasonal rainfall and flood challenges." },
      { id: "western-coastal-plains", label: "Western Coastal Plains", note: "A coastal belt affected by the Arabian Sea monsoon." },
    ],
    answerId: "indian-desert",
    explanation: "In many parts of the Indian Desert, low and uncertain rainfall and limited dependable water supplies influence settlement, livelihoods and farming. Density varies by locality, with towns, irrigation and access to water creating important exceptions.",
    takeaway: "Water availability is one influence on population distribution, but it works alongside employment, infrastructure, technology and historical settlement patterns.",
  },
  {
    id: "urban-migration-bengaluru",
    title: "The Urban Pull",
    chapter: "Migration & Urbanisation",
    difficulty: "Expert",
    objective: "Understand how employment and services can attract migrants to cities.",
    clues: [
      "I am a major city in southern India's Karnataka state.",
      "Information technology, education, healthcare and other services have helped make me an important destination for people moving for work and study.",
      "The movement of people into cities can change population size, diversity, housing demand and pressure on transport and services.",
    ],
    choices: [
      { id: "bengaluru", label: "Bengaluru", note: "A major technology, education and services centre in Karnataka." },
      { id: "mumbai", label: "Mumbai", note: "A major metropolitan and port city on the Arabian Sea coast." },
      { id: "delhi", label: "Delhi", note: "A major national capital region in northern India." },
      { id: "kolkata", label: "Kolkata", note: "A major metropolitan city in eastern India." },
    ],
    answerId: "bengaluru",
    explanation: "Cities can attract migrants through employment, education, healthcare and other services. Bengaluru is a major centre for technology and services, but migration also brings planning challenges involving housing, transport, water and public facilities.",
    takeaway: "Migration is a component of population change alongside births and deaths. Urbanisation refers to the increasing share of people living in urban areas and the growth of urban settlements.",
  },
];

export function scoreGeoAnswer(options: { usedHint: number; previousWrongAttempt: boolean; streak: number }): number {
  const base = Math.max(50, (options.previousWrongAttempt ? 70 : 100) - options.usedHint * 10);
  return base + Math.min(20, Math.max(0, options.streak) * 5);
}
