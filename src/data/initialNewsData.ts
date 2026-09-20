import { Article } from '../types/news';

export const INITIAL_NEWS_ARTICLES: Article[] = [
  {
    id: 'gn-art-001',
    title: 'Global Climate Accord Reaches Historic Consensus on Clean Grid Financing at Geneva Summit',
    slug: 'global-climate-accord-geneva-summit-grid-financing',
    summary: 'Delegates from 140 nations have finalized a landmark $300 billion multilateral financing framework dedicated to modernizing resilient energy grids across developing economies.',
    content: `GENEVA — In what international observers are designating one of the most consequential multilateral diplomatic breakthroughs of the decade, representatives from 140 member states concluded five straight days of intensive negotiations by establishing the Clean Grid Resilience Facility in Geneva.

The framework guarantees $300 billion in pooled sovereign guarantees, private blended capital, and concessionary loans over the next seven years. The primary objective is overhauling power transmission corridors across the Global South, enabling vast installations of solar, geothermal, and offshore wind power to connect safely to municipal and industrial hubs.

"This is not a symbolic pledge; it is an engineered capital pipeline," stated UN Climate Liaison Dr. Elena Rostova during the closing press briefing. "Energy transition cannot occur without transmission infrastructure. Without resilient cables, high-voltage converters, and regional interconnectors, clean power remains stranded at the point of generation."

Financial institutions from London, New York, Tokyo, and Frankfurt committed foundational tranches, backed by partial risk guarantees from the World Bank and the Asian Development Bank. The initiative addresses a chronic bottleneck: while renewable power equipment costs have plunged over 70% in recent years, grid modernization capital in emerging economies has lagged significantly due to currency volatility and higher cost of capital.

Construction on the first three regional interconnector corridors—spanning Eastern Africa, the Southeast Asian peninsula, and South America’s Andean perimeter—is slated to commence in early 2027, with preliminary site surveys already funded.`,
    image: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1200&q=80',
    imageCaption: 'Delegates convene inside the Palais des Nations during the final drafting plenary in Geneva.',
    source: 'Reuters Wire',
    sourceUrl: 'https://www.reuters.com',
    category: 'World',
    country: 'World',
    publishedAt: '2026-09-18T18:30:00Z',
    collectedAt: '2026-09-18T19:00:00Z',
    author: 'GlobalNews Today',
    tags: ['Geneva Summit', 'Climate Policy', 'Renewable Energy', 'World Bank', 'Infrastructure'],
    isBreaking: true,
    isFeatured: true,
    readingTimeMinutes: 4,
  },
  {
    id: 'gn-art-002',
    title: 'US Federal Reserve Signals Cautious Stance on Benchmark Rates Amid Stable Employment Metrics',
    slug: 'us-federal-reserve-benchmark-rates-employment-metrics',
    summary: 'Central bank leadership highlighted robust labor market participation and moderating core inflation while maintaining target funds rate in their latest policy statement.',
    content: `WASHINGTON, D.C. — The Federal Open Market Committee concluded its two-day policy symposium today, keeping benchmark borrowing costs unchanged while delivering a calibrated message of patience to financial markets.

In his scheduled press conference, the Federal Reserve Chair emphasized that while headline consumer price indices have cooled towards the central bank's long-term target, persistent service sector wage firmness warrants a measured, data-dependent trajectory.

"Our dual mandate—maximum sustainable employment and stable prices—remains in balanced equilibrium," the Chair remarked. "Premature loosening risks reigniting latent inflationary impulses, whereas overly restrictive policy would impose unnecessary frictions on business investment. We are positioned to act decisively should incoming data diverge from baseline forecasts."

Treasury yields experienced modest tightening following the statement, with two-year yields shifting by four basis points as market participants recalibrated expectations for late-autumn adjustments. Wall Street indices closed marginally higher, buoyed by the committee's optimistic evaluation of underlying productivity gains driven by automation and enterprise software investments.`,
    image: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80',
    imageCaption: 'The Federal Reserve Eccles Building in Washington, D.C.',
    source: 'Bloomberg News',
    sourceUrl: 'https://www.bloomberg.com',
    category: 'US',
    country: 'United States',
    publishedAt: '2026-09-18T19:45:00Z',
    collectedAt: '2026-09-18T20:10:00Z',
    author: 'GlobalNews Today',
    tags: ['Federal Reserve', 'US Economy', 'Interest Rates', 'Wall Street', 'Inflation'],
    isBreaking: false,
    isFeatured: true,
    readingTimeMinutes: 3,
  },
  {
    id: 'gn-art-003',
    title: 'International Consortium Ratifies Open Standards for Safe Multimodal AI System Deployments',
    slug: 'international-consortium-ratifies-open-standards-safe-multimodal-ai',
    summary: 'Leading research laboratories, academic bodies, and global standards institutes have established unified verification benchmarks for frontier artificial intelligence models.',
    content: `LONDON & SAN FRANCISCO — In a unified initiative spanning 28 premier research laboratories, technical universities, and national standards organizations, the Global AI Governance Framework (GAIGF) has formally published its comprehensive verification protocol for autonomous multimodal models.

The framework establishes rigorous third-party auditing standards for automated reasoning, bias mitigation, red-teaming against catastrophic biological risks, and transparency in synthetic training datasets. Crucially, the standard requires developers of frontier models to provide cryptographic provenance certificates verifying model lineage and safety boundary compliance.

"As artificial intelligence systems transition from predictive language models to autonomous agentic workflows acting directly on behalf of enterprises and governments, verifiable safety boundaries are no longer theoretical," explained Dr. Marcus Chen, co-director of the Frontier Computing Institute. "These protocols provide industry and regulators with measurable, empirical telemetry."

The standard has already been voluntarily integrated by seven leading commercial model developers, with open-source reference implementations made available to universities and independent safety researchers worldwide.`,
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80',
    imageCaption: 'Advanced neural model topology and automated verification clusters in testing.',
    source: 'MIT Tech Review Dispatch',
    sourceUrl: 'https://www.technologyreview.com',
    category: 'AI',
    country: 'International',
    publishedAt: '2026-09-18T17:15:00Z',
    collectedAt: '2026-09-18T17:40:00Z',
    author: 'GlobalNews Today',
    tags: ['Artificial Intelligence', 'AI Safety', 'Machine Learning', 'Tech Standards', 'Ethics'],
    isBreaking: false,
    isFeatured: true,
    readingTimeMinutes: 4,
  },
  {
    id: 'gn-art-004',
    title: 'UK and European Union Finalize Comprehensive North Sea Renewable Energy Interconnector Pact',
    slug: 'uk-eu-north-sea-renewable-energy-interconnector-pact',
    summary: 'A multi-billion pound infrastructure agreement will link offshore wind arrays across British, Dutch, and Norwegian waters into an interconnected European power corridor.',
    content: `LONDON — Representatives from the United Kingdom, the European Commission, Norway, and the Netherlands signed the historic North Sea Green Supergrid Accord in London this morning, establishing legal and regulatory mechanisms for joint offshore transmission lines.

The treaty unlocks private investments in cross-border undersea high-voltage direct current (HVDC) interconnectors capable of transmitting 25 gigawatts of offshore wind power directly between continental Europe and Great Britain.

The British Energy Secretary commended the multilateral spirit of the negotiations: "The North Sea represents one of the world's most dense offshore wind basins. By creating unified interconnectors rather than isolated point-to-point cables, we eliminate curtailment waste, lower household energy bills across Europe, and reinforce energy independence."

Industry analysts estimate the accord will reduce transmission bottleneck costs by an estimated £3.4 billion annually by 2032, while establishing unified standards for maritime biodiversity protection around turbine anchor sites.`,
    image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80',
    imageCaption: 'The Houses of Parliament along the River Thames in central London.',
    source: 'BBC News World Service',
    sourceUrl: 'https://www.bbc.com/news',
    category: 'UK',
    country: 'United Kingdom',
    publishedAt: '2026-09-18T16:20:00Z',
    collectedAt: '2026-09-18T16:50:00Z',
    author: 'GlobalNews Today',
    tags: ['UK News', 'North Sea', 'Offshore Wind', 'European Union', 'Clean Tech'],
    isBreaking: false,
    isFeatured: false,
    readingTimeMinutes: 3,
  },
  {
    id: 'gn-art-005',
    title: 'Quantum Computing Laboratory Demonstrates Fault-Tolerant Logical Qubit Scaling Milestone',
    slug: 'quantum-computing-logical-qubit-scaling-milestone',
    summary: 'Researchers demonstrate a 100-to-1 physical-to-logical error suppression ratio, bringing commercially practical quantum chemistry simulations significantly closer.',
    content: `OXFORD & BOSTON — In a peer-reviewed research paper published simultaneously with practical laboratory demonstrations, an international team of quantum physicists announced a milestone in quantum error correction.

By coupling surface-code lattice architectures with real-time cryogenic feedback loops, the team maintained coherent computation across 64 logical qubits for over ten continuous minutes, reducing physical gate errors by two orders of magnitude compared to uncorrected qubits.

"For decades, the limiting factor in quantum computing has not been raw physical qubit counts, but phase decoherence and noise," noted Lead Investigator Dr. Sophia Morales. "With this architecture, calculating complex molecular structures for catalyst design and room-temperature superconducting candidates shifts from theoretical mathematics to empirical computation."

The development has triggered significant interest across pharmaceutical synthesis and materials engineering sectors, where classical supercomputers have reached fundamental computational walls.`,
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
    imageCaption: 'Cryogenic dilution refrigerator housing the experimental superconducting quantum processor.',
    source: 'Nature International',
    sourceUrl: 'https://www.nature.com',
    category: 'Technology',
    country: 'International',
    publishedAt: '2026-09-18T15:00:00Z',
    collectedAt: '2026-09-18T15:30:00Z',
    author: 'GlobalNews Today',
    tags: ['Quantum Computing', 'Physics', 'Computing', 'Deep Tech', 'Hardware'],
    isBreaking: false,
    isFeatured: false,
    readingTimeMinutes: 4,
  },
  {
    id: 'gn-art-006',
    title: 'Canada Unveils Clean Hydrogen Export Corridor Linking British Columbia to Asian Markets',
    slug: 'canada-clean-hydrogen-corridor-british-columbia-asia',
    summary: 'Federal and provincial officials inaugurate a $14 billion port facility engineered to ship green ammonia and clean hydrogen fuel to Japan and South Korea.',
    content: `VANCOUVER — Canada took a decisive step in global clean commodity trade today with the formal commissioning of the Prince Rupert Marine Hydrogen Terminal in British Columbia.

The project, developed over four years in partnership with Indigenous coastal nations and international energy consortia, will convert abundant hydro-powered electrolyzers into green ammonia for export. First shipments bound for power utility terminals in Tokyo and Incheon are scheduled for departure next month.

The Canadian Minister of Natural Resources emphasized the export facility's alignment with reconciliation and ecological integrity: "This corridor demonstrates that major infrastructure can proceed with equity ownership by First Nations while furnishing democratic allies with dependable, zero-carbon industrial energy."

Initial contracts guarantee delivery of 1.2 million metric tonnes of clean carrier fuel annually through 2035, helping Asian steelmakers and thermal power operators meet strict emissions reduction mandates.`,
    image: 'https://images.unsplash.com/photo-1517935703635-2717090c2210?auto=format&fit=crop&w=1200&q=80',
    imageCaption: 'Coastal shipping waterways in British Columbia, Canada.',
    source: 'CBC News Canada',
    sourceUrl: 'https://www.cbc.ca',
    category: 'Canada',
    country: 'Canada',
    publishedAt: '2026-09-18T14:10:00Z',
    collectedAt: '2026-09-18T14:40:00Z',
    author: 'GlobalNews Today',
    tags: ['Canada', 'Clean Energy', 'Hydrogen', 'Trade', 'Asia-Pacific'],
    isBreaking: false,
    isFeatured: false,
    readingTimeMinutes: 3,
  },
  {
    id: 'gn-art-007',
    title: 'Australia Completes World-Leading Coral Reef Gene Banking and Resilient Nursery Initiative',
    slug: 'australia-coral-reef-gene-banking-resilient-nursery',
    summary: 'Marine biologists across Queensland catalog over 800 thermal-tolerant coral genotypes, deploying automated micro-fragmentation to restore southern reef sectors.',
    content: `CAIRNS — The Australian Institute of Marine Science, together with collaborative research stations along the Great Barrier Reef, celebrated the completion of the National Coral Bio-Bank and automated nursery network.

The cryo-preservation facility houses viable reproductive samples and tissue cultures of more than 800 coral species, providing a biological safeguard against oceanic heat anomalies while breeding varieties proven to thrive in elevated water temperatures.

Marine autonomous underwater drones equipped with multispectral cameras are currently planting micro-fragments onto degraded limestone bases at ten times the speed of traditional diver deployment.

"We are witnessing measurable recovery across protected sectors where lab-nurtured thermal-resilient strains have successfully spawned," noted Marine Ecology Director Dr. Bruce MacIntyre. "Human intervention combined with rapid robotics gives our oceans a fighting chance while atmospheric emissions stabilize."`,
    image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=1200&q=80',
    imageCaption: 'Vibrant coral reef ecosystems undergoing restoration off the coast of Queensland.',
    source: 'ABC News Australia',
    sourceUrl: 'https://www.abc.net.au',
    category: 'Australia',
    country: 'Australia',
    publishedAt: '2026-09-18T13:25:00Z',
    collectedAt: '2026-09-18T13:55:00Z',
    author: 'GlobalNews Today',
    tags: ['Australia', 'Great Barrier Reef', 'Conservation', 'Robotics', 'Marine Science'],
    isBreaking: false,
    isFeatured: false,
    readingTimeMinutes: 3,
  },
  {
    id: 'gn-art-008',
    title: 'Global Semiconductor Alliances Accelerate Next-Generation 1.4nm Chip Foundry Construction',
    slug: 'semiconductor-alliances-next-generation-14nm-foundry-construction',
    summary: 'Joint ventures spanning the United States, Europe, Japan, and Singapore announce initial test silicon runs for ultra-dense Angstrom-class microprocessors.',
    content: `SINGAPORE & DRESDEN — In an unprecedented convergence of public capital subsidies and private technology consortiums, commercial trial manufacturing for 1.4-nanometer class logic nodes commenced simultaneously across facilities in Singapore, Ohio, and Dresden this week.

The next generation of lithography relies on High-NA Extreme Ultraviolet (EUV) optical systems that print electronic circuits barely thicker than a strand of DNA. The resulting microchips are anticipated to deliver a 35% efficiency boost and a 20% computing speed improvement for edge smartphones, aerospace guidance computers, and datacenter clusters.

"Geographic diversification in advanced semiconductor fabrication has transformed from an industry debate into concrete fabrication capacity," noted semiconductor analyst Priya Raman in Singapore. "The global electronics supply chain is significantly more resilient today than it was four years ago."`,
    image: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80',
    imageCaption: 'Cleanroom technicians inspect silicon wafers processed with High-NA EUV lithography.',
    source: 'Financial Times Dispatch',
    sourceUrl: 'https://www.ft.com',
    category: 'Business',
    country: 'Singapore',
    publishedAt: '2026-09-18T12:00:00Z',
    collectedAt: '2026-09-18T12:30:00Z',
    author: 'GlobalNews Today',
    tags: ['Semiconductors', 'Chips', 'Business', 'Singapore', 'Manufacturing'],
    isBreaking: false,
    isFeatured: false,
    readingTimeMinutes: 4,
  },
  {
    id: 'gn-art-009',
    title: 'James Webb Space Telescope Confirms Atmospheric Water and Carbon Reservoirs on Rocky Exoplanet',
    slug: 'jwst-confirms-atmospheric-water-carbon-rocky-exoplanet',
    summary: 'Spectroscopic analysis of transit data from LHS 1140 b reveals chemical signatures consistent with a temperate ocean world located 48 light-years away.',
    content: `BALTIMORE — Astrophysics teams operating the James Webb Space Telescope at the Space Telescope Science Institute announced the detection of atmospheric water vapor and carbon dioxide absorption spectra around exoplanet LHS 1140 b.

Located approximately 48 light-years from Earth in the constellation Cetus, the planet orbits within the habitable zone of a calm red dwarf star. Unlike earlier target candidates that experienced intense stellar flaring, LHS 1140 b shows stable atmospheric retention.

"The atmospheric transit signatures strongly suggest a nitrogen-rich secondary atmosphere over a liquid ocean or deep ice-slush surface," announced Chief Astronomer Dr. Rebecca Thorne. "This represents one of the most compelling habitable exoplanet targets ever documented with modern space observatories."

Follow-up spectroscopic sweeps with both JWST and the upcoming European Extremely Large Telescope will search for biosignature disequilibrium molecules, including methane and ozone.`,
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    imageCaption: 'Artist rendering of an Earth-mass temperate ocean exoplanet in transit.',
    source: 'Associated Press Science Wire',
    sourceUrl: 'https://apnews.com',
    category: 'Science',
    country: 'World',
    publishedAt: '2026-09-18T11:15:00Z',
    collectedAt: '2026-09-18T11:45:00Z',
    author: 'GlobalNews Today',
    tags: ['JWST', 'Astronomy', 'Exoplanet', 'Space Exploration', 'Science'],
    isBreaking: false,
    isFeatured: false,
    readingTimeMinutes: 4,
  },
  {
    id: 'gn-art-010',
    title: 'Universal Targeted mRNA Immunotherapy Shows High Remission Rates in Phase III Oncology Trial',
    slug: 'universal-targeted-mrna-immunotherapy-phase-iii-trial',
    summary: 'Clinical investigators report a 68% long-term remission rate across aggressive solid tumors using personalized neoantigen vaccines paired with checkpoint inhibitors.',
    content: `BOSTON & BASEL — Medical researchers across 40 teaching hospitals in North America and Europe released findings from the comprehensive Phase III 'Panorama' oncology trial, demonstrating substantial efficacy for custom mRNA-directed cellular immunotherapy.

The treatment protocol analyzes an individual patient’s tumor biopsy to identify specific genetic neoantigens within five business days. A personalized therapeutic mRNA injection is then manufactured, teaching the patient's own cytotoxic T-cells to identify and neutralize malignant cells without damaging healthy tissues.

"This is fundamentally altering oncology from broad systemic chemotherapy towards precise cellular molecular biology," explained lead clinical trial investigator Dr. Arthur Davies. "Patients experienced minimal adverse toxicity while maintaining sustained clinical remission after two years of follow-up."

Regulatory applications have been submitted concurrently to the FDA, the European Medicines Agency, and the UK MHRA under expedited review pathways.`,
    image: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=1200&q=80',
    imageCaption: 'Biochemists formulate specialized lipid nanoparticles for medical immunotherapy.',
    source: 'The Lancet Medical Wire',
    sourceUrl: 'https://www.thelancet.com',
    category: 'Health',
    country: 'International',
    publishedAt: '2026-09-18T10:05:00Z',
    collectedAt: '2026-09-18T10:30:00Z',
    author: 'GlobalNews Today',
    tags: ['Medicine', 'Health', 'Immunotherapy', 'Oncology', 'Biotechnology'],
    isBreaking: false,
    isFeatured: false,
    readingTimeMinutes: 4,
  },
  {
    id: 'gn-art-011',
    title: 'Wimbledon Expands Sustainable Grass Courts with Geothermal Sub-Surface Aeration Systems',
    slug: 'wimbledon-sustainable-grass-courts-geothermal-aeration',
    summary: 'The All England Lawn Tennis Club completes a zero-emission environmental renovation of its historic championship grounds in southwest London.',
    content: `LONDON — The All England Lawn Tennis Club (AELTC) has completed a three-year sustainability engineering overhaul at Wimbledon, introducing subterranean geothermal heat pumps and recycled water drainage loops beneath all 18 championship grass courts.

The new system maintains optimal root-zone soil temperature and humidity through damp London mornings, drastically reducing rain delays and preserving pristine grass bounce characteristics across all fourteen tournament days.

"Wimbledon honors its deep traditions while embracing environmental innovation," said the AELTC Operations Director. "By eliminating gas heating and recycling 100% of rainwater runoff, we are preserving our sport’s oldest surface for the next century."

Grand Slam players testing the newly conditioned courts this week reported uniform ball bounce and exceptional footing stability ahead of summer championships.`,
    image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80',
    imageCaption: 'The historic Centre Court grass grounds at Wimbledon in London.',
    source: 'Sky Sports International',
    sourceUrl: 'https://www.skysports.com',
    category: 'Sports',
    country: 'United Kingdom',
    publishedAt: '2026-09-18T09:30:00Z',
    collectedAt: '2026-09-18T10:00:00Z',
    author: 'GlobalNews Today',
    tags: ['Tennis', 'Wimbledon', 'Sports', 'London', 'Sustainability'],
    isBreaking: false,
    isFeatured: false,
    readingTimeMinutes: 3,
  },
  {
    id: 'gn-art-012',
    title: 'International Film Preservation Guild Restores 50 Classic Masterpieces Using Optical Neural Models',
    slug: 'international-film-guild-restores-50-classic-masterpieces-neural-models',
    summary: 'Archivists in Paris, Tokyo, and Los Angeles restore historic celluloid films to pristine 8K resolution without introducing artificial halluncinations.',
    content: `PARIS & LOS ANGELES — The International Federation of Film Archives (FIAF) unveiled the initial cohort of 50 restored cinematic masterworks, rescued from deteriorating nitrate and acetate film stock using non-destructive laser photogrammetry and optical neural algorithms.

Unlike commercial AI upscalers that invent synthetic skin textures or distorted backgrounds, the open-source restoration algorithm was trained exclusively on authentic period lenses, photochemical emulsion reactions, and historical lighting equipment.

"We have preserved the grain, the contrast ratios, and the original artistic intent while repairing physical tears, dust scratching, and chemical vinegar decay," stated Senior Archivist Madeleine Beaufort at the Cinémathèque Française.

The restored collection, featuring historic cinema from Japan, Senegal, Brazil, Italy, and India, will be screened at film festivals worldwide and archived in perpetual cold storage deep inside the Svalbard Global Vault.`,
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
    imageCaption: 'Film projection equipment and archival reels during master restoration.',
    source: 'Variety International',
    sourceUrl: 'https://variety.com',
    category: 'Entertainment',
    country: 'International',
    publishedAt: '2026-09-18T08:45:00Z',
    collectedAt: '2026-09-18T09:15:00Z',
    author: 'GlobalNews Today',
    tags: ['Cinema', 'Film', 'Entertainment', 'Culture', 'Archival Tech'],
    isBreaking: false,
    isFeatured: false,
    readingTimeMinutes: 3,
  },
  {
    id: 'gn-art-013',
    title: 'High-Velocity Maglev Transit Network Opens Passenger Services Linking Tokyo to Nagoya',
    slug: 'maglev-transit-network-passenger-services-tokyo-nagoya',
    summary: 'The Chuo Shinkansen superconducting maglev train enters commercial revenue service, reducing travel time between Japanese metropolises to just 40 minutes at 505 km/h.',
    content: `TOKYO — Japan marked another milestone in surface transportation history as the initial commercial passenger run of the L0 Series Superconducting Maglev departed Tokyo’s Shinagawa Station, arriving in Nagoya just 40 minutes later.

Traveling along deep subterranean tunnels and elevated viaducts through the Southern Japanese Alps at a cruising velocity of 505 kilometers per hour (314 mph), the magnetic levitation technology generates virtually zero friction and produces 75% fewer carbon emissions per passenger-kilometer than commercial jet airliners.

Commuters and transport delegates from around the world rode the maiden journey, marvelling at the near-silent cabin acoustics and glass-smooth acceleration.

"This is the culmination of fifty years of continuous Japanese railway engineering and magnetic levitation mastery," said the Minister of Land, Infrastructure, and Transport. "It connects our major urban economies into a unified megacity corridor."`,
    image: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=1200&q=80',
    imageCaption: 'High-speed maglev train on elevated track approaching mountain terminal.',
    source: 'Kyodo News Wire',
    sourceUrl: 'https://english.kyodonews.net',
    category: 'Trending',
    country: 'World',
    publishedAt: '2026-09-18T07:20:00Z',
    collectedAt: '2026-09-18T07:50:00Z',
    author: 'GlobalNews Today',
    tags: ['Maglev', 'Transportation', 'Japan', 'High Speed Rail', 'Engineering'],
    isBreaking: false,
    isFeatured: true,
    readingTimeMinutes: 3,
  }
];
