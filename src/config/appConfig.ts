import { NewsCategory, NewsCountry, FeedSource } from '../types/news';

export const APP_CONFIG = {
  name: 'GlobalNews Today',
  shortName: 'GlobalNews',
  tagline: 'News From Around the World',
  description: 'Independent international news portal delivering breaking coverage, world analysis, business, technology, AI, and science for global English-speaking audiences.',
  contactEmail: 'editor@globalnewstoday.com',
  edition: 'International Edition',
  apiBaseUrl: (import.meta.env.VITE_NEWS_API_URL || '').replace(/\/$/, ''),
  useDemoData: import.meta.env.VITE_USE_DEMO_DATA === 'true',
  version: '1.6.0',
};

export const CATEGORIES_CONFIG: Array<{
  category: NewsCategory;
  slug: string;
  label: string;
  description: string;
}> = [
  { category: 'US', slug: 'us', label: 'US', description: 'United States politics, economy, culture, and national breaking events.' },
  { category: 'UK', slug: 'uk', label: 'UK', description: 'United Kingdom politics, British society, monarchy, and economic policy.' },
  { category: 'World', slug: 'world', label: 'World', description: 'International affairs, geopolitics, global treaties, and cross-border developments.' },
  { category: 'Canada', slug: 'canada', label: 'Canada', description: 'Canadian government, provinces, national economy, and bilateral agreements.' },
  { category: 'Australia', slug: 'australia', label: 'Australia', description: 'Australian federal affairs, Pacific diplomacy, mining, and regional reports.' },
  { category: 'Business', slug: 'business', label: 'Business', description: 'Global markets, central bank rates, trade policies, commodities, and corporate shifts.' },
  { category: 'Technology', slug: 'technology', label: 'Technology', description: 'Consumer tech, semiconductor developments, cybersecurity, and platform engineering.' },
  { category: 'AI', slug: 'ai', label: 'AI', description: 'Frontier AI models, robotics, regulatory governance, and computational intelligence.' },
  { category: 'Science', slug: 'science', label: 'Science', description: 'Space exploration, astrophysics, climate studies, biotechnology, and physics.' },
  { category: 'Health', slug: 'health', label: 'Health', description: 'Global medicine, healthcare technology, clinical trials, and public health policies.' },
  { category: 'Sports', slug: 'sports', label: 'Sports', description: 'International football, Formula 1, tennis, cricket, rugby, and Olympic athletics.' },
  { category: 'Entertainment', slug: 'entertainment', label: 'Entertainment', description: 'Film, television, literature, arts, and global cultural discourse.' },
  { category: 'Politics', slug: 'politics', label: 'Politics', description: 'Elections, legislative debates, diplomacy, and sovereign governance.' },
  { category: 'Lifestyle', slug: 'lifestyle', label: 'Lifestyle', description: 'Architecture, design, food culture, work trends, and modern living.' },
  { category: 'Travel', slug: 'travel', label: 'Travel', description: 'Aviation, global destinations, sustainable tourism, and international transit.' },
  { category: 'Weather', slug: 'weather', label: 'Weather', description: 'Global meteorological events, storm tracking, and seasonal climate patterns.' },
  { category: 'Trending', slug: 'trending', label: 'Trending', description: 'High-velocity stories capturing the global conversation today.' },
];

export const COUNTRIES_CONFIG: NewsCountry[] = [
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'New Zealand',
  'Singapore',
  'World',
  'International',
];

export const FALLBACK_IMAGES: Record<NewsCategory, string> = {
  US: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80',
  UK: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80',
  World: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
  Canada: 'https://images.unsplash.com/photo-1517935703635-2717090c2210?auto=format&fit=crop&w=1200&q=80',
  Australia: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=1200&q=80',
  Business: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80',
  Technology: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
  AI: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80',
  Science: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=1200&q=80',
  Health: 'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=1200&q=80',
  Sports: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80',
  Entertainment: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
  Politics: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&w=1200&q=80',
  Lifestyle: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80',
  Travel: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80',
  Weather: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=1200&q=80',
  Trending: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1200&q=80',
};

export const DEFAULT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=1200&q=80';

// Configured public and official RSS feeds for auto collector
export const DEFAULT_FEED_SOURCES: FeedSource[] = [
  {
    id: 'bbc-world',
    name: 'BBC News World',
    url: 'https://feeds.bbci.co.uk/news/world/rss.xml',
    category: 'World',
    country: 'World',
    enabled: true,
    status: 'active',
  },
  {
    id: 'bbc-business',
    name: 'BBC Business',
    url: 'https://feeds.bbci.co.uk/news/business/rss.xml',
    category: 'Business',
    country: 'United Kingdom',
    enabled: true,
    status: 'active',
  },
  {
    id: 'npr-news',
    name: 'NPR News',
    url: 'https://feeds.npr.org/1001/rss.xml',
    category: 'US',
    country: 'United States',
    enabled: true,
    status: 'active',
  },
  {
    id: 'sky-tech',
    name: 'Sky News Technology',
    url: 'https://feeds.skynews.com/feeds/rss/technology.xml',
    category: 'Technology',
    country: 'United Kingdom',
    enabled: true,
    status: 'active',
  },
  {
    id: 'cbc-canada',
    name: 'CBC Canada',
    url: 'https://www.cbc.ca/cmlink/rss-topstories',
    category: 'Canada',
    country: 'Canada',
    enabled: true,
    status: 'active',
  },
  {
    id: 'abc-australia',
    name: 'ABC News Australia',
    url: 'https://www.abc.net.au/news/feed/45910/rss.xml',
    category: 'Australia',
    country: 'Australia',
    enabled: true,
    status: 'active',
  },
  {
    id: 'ars-technica',
    name: 'Ars Technica Science',
    url: 'https://feeds.arstechnica.com/arstechnica/science',
    category: 'Science',
    country: 'United States',
    enabled: true,
    status: 'active',
  },
];
