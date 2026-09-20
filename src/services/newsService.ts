import { Article, CollectorStatus, CollectorSyncResult, NewsCategory, NewsCountry } from '../types/news';
import { APP_CONFIG } from '../config/appConfig';
import { INITIAL_NEWS_ARTICLES } from '../data/initialNewsData';
import { newsCollector } from './newsCollector';

const LOCAL_STORAGE_ARTICLES = 'gnt_stored_articles_v2';
const LOCAL_STORAGE_STATUS = 'gnt_collector_status_v2';
const LOCAL_STORAGE_BOOKMARKS = 'gnt_bookmarked_ids_v1';

class NewsService {
  private inMemoryArticles: Article[] = [];
  private collectorStatus: CollectorStatus;
  private isInitialized = false;

  constructor() {
    this.collectorStatus = {
      status: 'ONLINE',
      lastSync: new Date().toISOString(),
      totalArticles: INITIAL_NEWS_ARTICLES.length,
      newArticlesLastSync: 0,
      duplicateArticlesPrevented: 0,
      sourcesCount: 7,
      activeSources: 7,
      failedSources: 0,
    };
  }

  /**
   * Initializes local storage cache or defaults to INITIAL_NEWS_ARTICLES
   */
  private initStorage(): void {
    if (this.isInitialized) return;

    try {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem(LOCAL_STORAGE_ARTICLES);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.inMemoryArticles = parsed;
          }
        }

        const cachedStatus = localStorage.getItem(LOCAL_STORAGE_STATUS);
        if (cachedStatus) {
          this.collectorStatus = JSON.parse(cachedStatus);
        }
      }
    } catch (e) {
      console.warn('Could not read from localStorage:', e);
    }

    if (this.inMemoryArticles.length === 0) {
      this.inMemoryArticles = [...INITIAL_NEWS_ARTICLES];
    }

    this.collectorStatus.totalArticles = this.inMemoryArticles.length;
    this.isInitialized = true;
  }

  private saveToStorage(): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_ARTICLES, JSON.stringify(this.inMemoryArticles));
        localStorage.setItem(LOCAL_STORAGE_STATUS, JSON.stringify(this.collectorStatus));
      }
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }
  }

  /**
   * Helper to perform fetch against either remote Worker or local API with fallback
   */
  private async fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
    const baseUrl = APP_CONFIG.apiBaseUrl;
    const url = baseUrl ? `${baseUrl}${endpoint}` : endpoint;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options?.headers || {}),
        },
      });

      if (!response.ok) {
        throw new Error(`API returned HTTP ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      // Gracefully return null so caller falls back to local data
      return null;
    }
  }

  /**
   * Get all articles (sorted by date)
   */
  public async getArticles(): Promise<Article[]> {
    this.initStorage();

    // If external worker configured, attempt to fetch
    if (APP_CONFIG.apiBaseUrl) {
      const remote = await this.fetchApi<{ success: boolean; data: Article[] }>('/api/news');
      if (remote && remote.data && Array.isArray(remote.data)) {
        this.inMemoryArticles = remote.data;
        this.saveToStorage();
        return this.inMemoryArticles;
      }
    }

    return [...this.inMemoryArticles];
  }

  public async getAllArticles(): Promise<Article[]> {
    return this.getArticles();
  }

  /**
   * Get latest articles
   */
  public async getLatestArticles(limit: number = 10): Promise<Article[]> {
    const articles = await this.getArticles();
    return articles.slice(0, limit);
  }

  /**
   * Get single article by slug
   */
  public async getArticleBySlug(slug: string): Promise<Article | null> {
    this.initStorage();

    if (APP_CONFIG.apiBaseUrl) {
      const remote = await this.fetchApi<{ success: boolean; data: Article }>(`/api/news/article/${slug}`);
      if (remote && remote.data) {
        return remote.data;
      }
    }

    const found = this.inMemoryArticles.find(a => a.slug === slug);
    return found || null;
  }

  /**
   * Get articles by category
   */
  public async getArticlesByCategory(category: NewsCategory): Promise<Article[]> {
    this.initStorage();

    if (APP_CONFIG.apiBaseUrl) {
      const remote = await this.fetchApi<{ success: boolean; data: Article[] }>(
        `/api/news/category/${encodeURIComponent(category.toLowerCase())}`
      );
      if (remote && remote.data) {
        return remote.data;
      }
    }

    return this.inMemoryArticles.filter(
      a => a.category.toLowerCase() === category.toLowerCase()
    );
  }

  /**
   * Get articles by country/region
   */
  public async getArticlesByCountry(country: NewsCountry): Promise<Article[]> {
    this.initStorage();

    if (APP_CONFIG.apiBaseUrl) {
      const remote = await this.fetchApi<{ success: boolean; data: Article[] }>(
        `/api/news/country/${encodeURIComponent(country.toLowerCase())}`
      );
      if (remote && remote.data) {
        return remote.data;
      }
    }

    return this.inMemoryArticles.filter(
      a => a.country.toLowerCase() === country.toLowerCase()
    );
  }

  /**
   * Search articles with debouncing support
   */
  public async searchArticles(query: string): Promise<Article[]> {
    this.initStorage();
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) return [];

    if (APP_CONFIG.apiBaseUrl) {
      const remote = await this.fetchApi<{ success: boolean; data: Article[] }>(
        `/api/news/search?q=${encodeURIComponent(cleanQuery)}`
      );
      if (remote && remote.data) {
        return remote.data;
      }
    }

    return this.inMemoryArticles.filter(article => {
      const inTitle = article.title.toLowerCase().includes(cleanQuery);
      const inSummary = article.summary.toLowerCase().includes(cleanQuery);
      const inContent = article.content.toLowerCase().includes(cleanQuery);
      const inCategory = article.category.toLowerCase().includes(cleanQuery);
      const inCountry = article.country.toLowerCase().includes(cleanQuery);
      const inTags = article.tags.some(t => t.toLowerCase().includes(cleanQuery));
      const inSource = article.source.toLowerCase().includes(cleanQuery);
      return inTitle || inSummary || inContent || inCategory || inCountry || inTags || inSource;
    });
  }

  /**
   * Get breaking stories
   */
  public async getBreakingNews(): Promise<Article[]> {
    const articles = await this.getArticles();
    const breaking = articles.filter(a => a.isBreaking);
    if (breaking.length > 0) return breaking;
    // Fallback to latest top 3 articles
    return articles.slice(0, 3);
  }

  public async getBreakingArticles(): Promise<Article[]> {
    return this.getBreakingNews();
  }

  /**
   * Get featured stories
   */
  public async getFeaturedNews(): Promise<Article[]> {
    const articles = await this.getArticles();
    const featured = articles.filter(a => a.isFeatured);
    if (featured.length > 0) return featured;
    return articles.slice(0, 4);
  }

  /**
   * Get related articles for an article
   */
  public async getRelatedArticles(article: Article, limit: number = 4): Promise<Article[]> {
    const articles = await this.getArticles();
    return articles
      .filter(a => a.id !== article.id)
      .filter(a => a.category === article.category || a.country === article.country || a.tags.some(t => article.tags.includes(t)))
      .slice(0, limit);
  }

  /**
   * Get current collector health and status
   */
  public async getCollectorStatus(): Promise<CollectorStatus> {
    this.initStorage();

    if (APP_CONFIG.apiBaseUrl) {
      const remote = await this.fetchApi<{ success: boolean; data: CollectorStatus }>('/api/collector/status');
      if (remote && remote.data) {
        this.collectorStatus = remote.data;
        return this.collectorStatus;
      }
    }

    return { ...this.collectorStatus };
  }

  /**
   * Trigger manual or automatic news collection cycle
   */
  public async triggerCollectorSync(): Promise<CollectorSyncResult> {
    this.initStorage();

    // 1. If external worker or backend API available, call POST /api/feed/collect
    if (APP_CONFIG.apiBaseUrl) {
      const remote = await this.fetchApi<{ success: boolean; result: CollectorSyncResult; status: CollectorStatus }>(
        '/api/feed/collect',
        { method: 'POST' }
      );
      if (remote && remote.result) {
        if (remote.status) this.collectorStatus = remote.status;
        this.saveToStorage();
        return remote.result;
      }
    }

    // 2. Otherwise run internal NewsCollectorService
    this.collectorStatus.status = 'SYNCING';
    try {
      const syncOutput = await newsCollector.runSync(this.inMemoryArticles);
      this.inMemoryArticles = syncOutput.updatedArticles;
      this.collectorStatus = syncOutput.status;
      this.saveToStorage();
      return syncOutput.result;
    } catch (err: any) {
      this.collectorStatus.status = 'ERROR';
      this.collectorStatus.lastError = err.message || 'Collection sync error';
      this.saveToStorage();
      return {
        success: false,
        message: `Collector error: ${err.message || 'Unknown failure'}`,
        fetchedCount: 0,
        newCount: 0,
        duplicateCount: 0,
        failedSources: [],
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Bookmarks / Saved stories helpers
   */
  public getBookmarkedIds(): string[] {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(LOCAL_STORAGE_BOOKMARKS);
        return stored ? JSON.parse(stored) : [];
      }
    } catch {
      return [];
    }
    return [];
  }

  public toggleBookmark(id: string): boolean {
    try {
      const current = this.getBookmarkedIds();
      const exists = current.includes(id);
      let updated: string[];
      if (exists) {
        updated = current.filter(item => item !== id);
      } else {
        updated = [...current, id];
      }
      localStorage.setItem(LOCAL_STORAGE_BOOKMARKS, JSON.stringify(updated));
      return !exists;
    } catch {
      return false;
    }
  }
}

export const newsService = new NewsService();
