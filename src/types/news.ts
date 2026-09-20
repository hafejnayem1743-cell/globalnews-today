export type NewsCategory =
  | 'US'
  | 'UK'
  | 'World'
  | 'Canada'
  | 'Australia'
  | 'Business'
  | 'Technology'
  | 'AI'
  | 'Science'
  | 'Health'
  | 'Sports'
  | 'Entertainment'
  | 'Politics'
  | 'Lifestyle'
  | 'Travel'
  | 'Weather'
  | 'Trending';

export type NewsCountry =
  | 'United States'
  | 'United Kingdom'
  | 'Canada'
  | 'Australia'
  | 'New Zealand'
  | 'Singapore'
  | 'World'
  | 'International';

export interface Article {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  image: string;
  imageCaption?: string;
  source: string;
  sourceUrl: string;
  category: NewsCategory;
  country: NewsCountry;
  publishedAt: string; // ISO 8601 UTC
  collectedAt: string; // ISO 8601 UTC
  author?: string;
  tags: string[];
  isBreaking?: boolean;
  isFeatured?: boolean;
  isPublished?: boolean;
  readingTimeMinutes?: number;
}

export interface FeedSource {
  id: string;
  name: string;
  url: string;
  category: NewsCategory;
  country: NewsCountry;
  enabled: boolean;
  lastChecked?: string;
  status: 'active' | 'failed' | 'idle';
  errorCount?: number;
}

export interface CollectorStatus {
  status: 'ONLINE' | 'SYNCING' | 'STANDBY' | 'ERROR';
  lastSync: string;
  totalArticles: number;
  newArticlesLastSync: number;
  duplicateArticlesPrevented: number;
  sourcesCount: number;
  activeSources: number;
  failedSources: number;
  lastError?: string;
}

export interface CollectorSyncResult {
  success: boolean;
  message: string;
  fetchedCount: number;
  newCount: number;
  duplicateCount: number;
  failedSources: string[];
  timestamp: string;
}

export type ViewMode =
  | { type: 'home' }
  | { type: 'article'; slug: string }
  | { type: 'category'; category: NewsCategory }
  | { type: 'country'; country: NewsCountry }
  | { type: 'search'; query: string }
  | { type: 'bookmarks' };
